import { test, expect } from '@playwright/test';

test('discovers an event, watches it and compares a second event', async ({ page }) => {
  await page.goto('/?mode=demo');
  await expect(page.getByRole('heading', { name: 'Discover markets' })).toBeVisible();
  await page.getByRole('button', { name: /Open market: Will the Aurora/ }).click();
  const detail = page.getByRole('region', { name: 'Market research' });
  await expect(detail.getByText('64%', { exact: true })).toBeVisible();
  await detail.getByRole('button', { name: 'Add to watchlist' }).click();
  await expect(page.getByRole('complementary', { name: 'Watchlist' }).getByText(/Aurora mission/)).toBeVisible();
  await page.getByRole('button', { name: /Open market: Will SOL/ }).click();
  await detail.getByRole('button', { name: 'Add to watchlist' }).click();
  await page.getByRole('checkbox', { name: /Compare Will the Aurora/ }).check();
  await page.getByRole('checkbox', { name: /Compare Will SOL/ }).check();
  await expect(page.getByRole('region', { name: 'Market comparison' }).getByText('38%', { exact: true })).toBeVisible();
  await expect(page.getByText(/One quote observed/)).toBeVisible();
  await expect(page.getByText('Catalogue volume', { exact: true }).first()).toBeVisible();
});
test('filters by category and phase and searches only the loaded catalogue', async ({ page }) => {
  await page.goto('/?mode=demo');
  await page.getByLabel('Category').selectOption('science');
  await page.getByLabel('Market phase').selectOption('primary');
  await expect(page.getByRole('button', { name: /Open market:/ })).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Atlas telescope/ })).toBeVisible();
  await page.getByLabel('Search loaded markets').fill('no such event');
  await expect(page.getByText('No loaded markets match your search')).toBeVisible();
  await expect(page.getByText(/Search covers .* loaded market/)).toBeVisible();
});
test('loads the next page without losing the first page', async ({ page }) => {
  await page.route('**/api/markets?*', async route => {
    if (new URL(route.request().url()).searchParams.has('cursor')) return route.continue();
    const response = await route.fetch(); const body = await response.json();
    body.data.items = body.data.items.slice(0, 2); body.data.nextCursor = body.data.items[1].marketId;
    await route.fulfill({ response, json: body });
  });
  await page.goto('/?mode=demo');
  await expect(page.getByRole('button', { name: /Open market:/ })).toHaveCount(2);
  await page.getByRole('button', { name: 'Load more markets' }).click();
  await expect(page.getByRole('button', { name: /Open market:/ })).toHaveCount(7);
});
test('shows empty and failing catalogues with actionable states', async ({ page }) => {
  await page.route('**/api/markets?*', async route => {
    const response = await route.fetch(); const body = await response.json();
    body.data = { items: [], nextCursor: null }; await route.fulfill({ response, json: body });
  });
  await page.goto('/?mode=demo');
  await expect(page.getByText('No markets in this selection')).toBeVisible();
  await page.unroute('**/api/markets?*');
  await page.route('**/api/markets?*', route => route.fulfill({ status: 502, json: { error: { code: 'UPSTREAM_UNAVAILABLE', message: 'Panta is temporarily unavailable' } } }));
  await page.reload();
  await expect(page.getByText('Panta is temporarily unavailable', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry catalogue' })).toBeVisible();
});
test('keeps live failures visible without silently enabling examples', async ({ page }) => {
  await page.goto('/?mode=live');
  await expect(page.getByText('Live access is not configured', { exact: true })).toBeVisible();
  await expect(page.getByTestId('demo-banner')).toHaveCount(0);
  await page.getByRole('button', { name: 'Example data' }).click();
  await expect(page.getByTestId('demo-banner')).toBeVisible();
  await expect(page.getByRole('button', { name: /Aurora mission/ }).first()).toBeVisible();
});
test('ignores a previous market response after the user changes selection', async ({ page }) => {
  let delayedId = '';
  await page.route('**/api/markets/*?*', async route => {
    const id = new URL(route.request().url()).pathname.split('/').at(-1)!;
    if (!delayedId) delayedId = id;
    if (id === delayedId) await new Promise(resolve => setTimeout(resolve, 1200));
    await route.continue();
  });
  await page.goto('/?mode=demo');
  await page.getByRole('button', { name: /Open market: Will SOL/ }).click();
  const detail = page.getByRole('region', { name: 'Market research' });
  await expect(detail.getByRole('heading', { name: /Will SOL/ })).toBeVisible();
  await expect(detail.getByText('38%', { exact: true })).toBeVisible();
  await page.waitForTimeout(1400);
  await expect(detail.getByRole('heading', { name: /Will SOL/ })).toBeVisible();
});
