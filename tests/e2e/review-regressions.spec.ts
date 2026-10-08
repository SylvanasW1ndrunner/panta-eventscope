import { test, expect, type Page } from '@playwright/test';
import type { CatalogPage, Market, ReadResult } from '../../src/features/markets/model';

test('selects detail from the newly filtered catalogue', async ({ page }) => {
  await page.goto('/?mode=demo');
  await expect(page.getByRole('region', { name: 'Market research' }).getByRole('heading', { name: /Aurora/ })).toBeVisible();
  await page.getByLabel('Category').selectOption('science');
  await expect(page.getByRole('button', { name: /Open market:/ })).toHaveCount(3);
  await page.getByLabel('Market phase').selectOption('primary');
  await expect(page.getByRole('button', { name: /Open market:/ })).toHaveCount(1);
  const research = page.getByRole('region', { name: 'Market research' });
  await expect(research.getByRole('heading', { name: /Atlas telescope/ })).toBeVisible();
  await expect(research.getByRole('heading', { name: /Aurora/ })).toHaveCount(0);
});

test('clears research when the new filter has no markets', async ({ page }) => {
  await page.goto('/?mode=demo');
  await expect(page.getByRole('region', { name: 'Market research' }).getByRole('heading', { name: /Aurora/ })).toBeVisible();
  await page.route('**/api/markets?*', route => route.fulfill({ json: { mode: 'demo', fetchedAt: Date.now(), ageMs: 0, stale: false, warnings: [], data: { items: [], nextCursor: null } } }));
  await page.getByLabel('Category').selectOption('finance');
  await expect(page.getByText('No markets in this selection')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Choose an event to research', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Generate evidence brief', exact: true })).toHaveCount(0);
});

test('ages comparison and tape during a read pause without another successful response', async ({ page }) => {
  await page.clock.install({ time: new Date() });
  await page.goto('/?mode=demo');
  const research = page.getByRole('region', { name: 'Market research' });
  await expect(research.getByText('64%', { exact: true })).toBeVisible();
  await research.getByRole('button', { name: 'Add to watchlist', exact: true }).click();
  await page.getByRole('checkbox', { name: /Compare Will the Aurora/ }).check();
  await expect(page.getByRole('region', { name: 'Trade evidence' }).getByText('4 returned', { exact: true })).toBeVisible();
  await page.route('**/api/categories?mode=demo', route => route.fulfill({ status: 429, json: { error: { code: 'RATE_LIMITED', message: 'Categories paused.', retryAt: Date.now() + 180000 } } }));
  // An unrelated resource establishes a global pause; successful detail/tape reads remain unflagged.
  await page.route('**/api/markets?*', async route => {
    const response = await route.fetch(); const body = await response.json();
    await route.fulfill({ json: { ...body, retryAt: Date.now() + 180000 } });
  });
  await research.getByRole('button', { name: /Refresh reads/ }).click();
  await expect(page.getByText(/Reads paused until/)).toBeVisible();
  await page.clock.fastForward(61000);
  await expect(page.getByRole('region', { name: 'Market comparison' }).getByText('YES quote · stale', { exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Trade evidence' }).getByText(/Tape read .* stale/)).toBeVisible();
});

test('explains a successful stale catalogue fallback with its original read time', async ({ page }) => {
  await page.goto('/?mode=demo');
  await expect(page.getByRole('button', { name: /Open market: Will the Aurora/ })).toBeVisible();
  const body = await (await page.request.get('/api/markets?mode=demo&limit=20')).json();
  await page.route('**/api/markets?*', route => route.fulfill({ json: { ...body, stale: true, fetchedAt: Date.now() - 120000, ageMs: 120000, warnings: ['Upstream unavailable. Retaining the prior catalogue.'] } }));
  await page.getByRole('region', { name: 'Market research' }).getByRole('button', { name: /Refresh reads/ }).click();
  const discovery = page.getByRole('complementary', { name: 'Market discovery' });
  await expect(discovery.getByText('Catalogue · stale', { exact: true })).toBeVisible();
  await expect(discovery.getByText('Upstream unavailable. Retaining the prior catalogue.', { exact: true })).toBeVisible();
  await expect(discovery.getByText(/Oldest page read:/)).toBeVisible();
  await expect(discovery.getByRole('button', { name: 'Retry catalogue', exact: true })).toBeVisible();
});

test('keeps earlier page freshness when merging a later fresh page', async ({ page }) => {
  const body: ReadResult<CatalogPage> = await (await page.request.get('/api/markets?mode=demo&limit=20')).json();
  const oldTime = Date.now() - 120000;
  await page.route('**/api/markets?*', route => {
    const second = new URL(route.request().url()).searchParams.has('cursor');
    return route.fulfill({ json: { ...body, fetchedAt: second ? Date.now() : oldTime, stale: !second,
      warnings: second ? [] : ['Earlier page is stale.'], data: { items: [body.data.items[second ? 1 : 0]], nextCursor: second ? null : 'page-two' } } });
  });
  await page.goto('/?mode=demo');
  await page.getByRole('button', { name: 'Load more markets', exact: true }).click();
  await expect(page.getByRole('button', { name: /Open market:/ })).toHaveCount(2);
  const discovery = page.getByRole('complementary', { name: 'Market discovery' });
  await expect(discovery.getByText('Catalogue · stale', { exact: true })).toBeVisible();
  await expect(discovery.getByText('Earlier page is stale.', { exact: true })).toBeVisible();
});

test('shows category failures and restores filters through retry', async ({ page }) => {
  let fail = true;
  await page.route('**/api/categories?mode=demo', route => fail
    ? route.fulfill({ status: 503, json: { error: { code: 'UPSTREAM_UNAVAILABLE', message: 'Categories temporarily unavailable.' } } }) : route.continue());
  await page.goto('/?mode=demo');
  const discovery = page.getByRole('complementary', { name: 'Market discovery' });
  await expect(discovery.getByText('Categories temporarily unavailable.', { exact: true })).toBeVisible();
  fail = false;
  await discovery.getByRole('button', { name: 'Retry categories', exact: true }).click();
  await expect(page.getByLabel('Category').locator('option[value="science"]')).toHaveCount(1);
  await expect(discovery.getByText('Categories temporarily unavailable.', { exact: true })).toHaveCount(0);
});

async function seedMovementWindow(page: Page) {
  const catalogue: ReadResult<CatalogPage> = await (await page.request.get('/api/markets?mode=demo&limit=20')).json();
  const events = catalogue.data.items.slice(0, 2);
  const time = Date.now();
  const histories = Object.fromEntries(events.map((event, index) => [event.marketId,
    Array.from({ length: 20 }, (_, i) => ({ marketId: event.marketId, mode: 'demo', phase: 'secondary', observedAt: time - (20 - i) * 30000, yesPrice: index ? '0.2' : '0.4', noPrice: index ? '0.8' : '0.6' }))]));
  const workspace = { version: 1, watchlist: events.map(event => event.marketId), compare: [], histories, thresholdPp: 5 };
  await page.addInitScript(value => localStorage.setItem('eventscope:v1:demo', JSON.stringify(value)), workspace);
  return events;
}

test('retains two identified simultaneous crossings until individual dismissal', async ({ page }) => {
  const events = await seedMovementWindow(page);
  await page.goto('/?mode=demo');
  const alerts = page.getByRole('region', { name: 'Quote movement alerts' });
  await expect(page.locator('main [role="alert"]')).toHaveCount(2);
  for (const event of events) await expect(alerts.getByRole('button', { name: `Open alerted market: ${event.title}`, exact: true })).toBeVisible();
  await alerts.getByRole('button', { name: `Dismiss alert for ${events[0].title}`, exact: true }).click();
  await expect(page.locator('main [role="alert"]')).toHaveCount(1);
  await alerts.getByRole('button', { name: `Open alerted market: ${events[1].title}`, exact: true }).click();
  await expect(page.getByRole('region', { name: 'Market research' }).getByRole('heading', { name: events[1].title, exact: true })).toBeVisible();
});

test('keeps an earlier notification when another watched event crosses later', async ({ page }) => {
  const events = await seedMovementWindow(page);
  let secondCrosses = false;
  await page.route(`**/api/markets/${events[1].marketId}?mode=demo`, async route => {
    const body: ReadResult<Market> = await (await route.fetch()).json();
    await route.fulfill({ json: { ...body, fetchedAt: Date.now(), data: { ...body.data, yesPrice: secondCrosses ? '0.38' : '0.2', noPrice: secondCrosses ? '0.62' : '0.8' } } });
  });
  await page.goto('/?mode=demo');
  const alerts = page.getByRole('region', { name: 'Quote movement alerts' });
  await expect(page.locator('main [role="alert"]')).toHaveCount(1);
  secondCrosses = true;
  await page.getByRole('region', { name: 'Market research' }).getByRole('button', { name: /Refresh reads/ }).click();
  await expect(page.locator('main [role="alert"]')).toHaveCount(2);
  for (const event of events) await expect(alerts.getByRole('button', { name: `Open alerted market: ${event.title}`, exact: true })).toBeVisible();
});
