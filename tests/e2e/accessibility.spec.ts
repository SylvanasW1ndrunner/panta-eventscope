import { test, expect } from '@playwright/test';
test('supports narrow-screen research, watchlists and exporting without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?mode=demo');
  await expect(page.getByRole('heading', { name: 'Discover markets' })).toBeVisible();
  await page.getByRole('button', { name: /Open market: Will the Aurora/ }).click();
  await expect(page.getByRole('region', { name: 'Market research' }).getByText('64%', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add to watchlist' }).click();
  await page.getByRole('button', { name: 'Watchlist', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: /Compare Will the Aurora/ })).toBeVisible();
  await page.getByRole('button', { name: 'Research', exact: true }).click();
  await page.getByRole('button', { name: 'Generate evidence brief' }).click();
  await expect(page.getByRole('button', { name: 'Download JSON' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test('supports keyboard controls and restores focus from the explanation dialog', async ({ page }) => {
  await page.goto('/?mode=live');
  const examples = page.getByRole('button', { name: 'Example data', exact: true });
  await examples.focus(); await page.keyboard.press('Space');
  await expect(page.getByTestId('demo-banner')).toBeVisible();
  const explain = page.getByRole('button', { name: 'What the data means' });
  await explain.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(explain).toBeFocused();
});
test('renders untrusted market content as text without script execution', async ({ page }) => {
  const unsafeTitle = '<img src=x onerror="window.__unsafeExecuted=true">';
  await page.route('**/api/markets**', async route => {
    const response = await route.fetch(); const body = await response.json();
    if (body.data?.items) { body.data.items[0].title = unsafeTitle; body.data.items[0].description = '<script>window.__unsafeExecuted=true</script>'; }
    else if (body.data?.marketId) { body.data.title = unsafeTitle; body.data.description = '<script>window.__unsafeExecuted=true</script>'; }
    await route.fulfill({ response, json: body });
  });
  await page.goto('/?mode=demo');
  await expect(page.getByRole('region', { name: 'Market research' }).getByRole('heading', { name: unsafeTitle, exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).__unsafeExecuted)).toBeUndefined();
  await expect(page.locator('.research img')).toHaveCount(0);
});
test('keeps unavailable quotes missing and does not draw invented history', async ({ page }) => {
  await page.goto('/?mode=demo');
  await page.getByRole('button', { name: /Open market: Will the reference rate/ }).click();
  const detail = page.getByRole('region', { name: 'Market research' });
  await expect(detail.getByText('Price unavailable', { exact: true })).toHaveCount(2);
  await expect(detail.locator('.quote strong').filter({ hasText: /^0%$/ })).toHaveCount(0);
  await expect(detail.locator('polyline')).toHaveCount(0);
});
test('persists watches without sharing them with live mode', async ({ page }) => {
  await page.goto('/?mode=demo');
  await page.getByRole('button', { name: 'Add to watchlist' }).click();
  await expect(page.getByRole('button', { name: 'Remove from watchlist', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Remove from watchlist', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Live Panta' }).click();
  await expect(page.getByRole('complementary', { name: 'Market discovery' }).locator('.error-box > strong').filter({ hasText: /^Live access is not configured$/ })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Watchlist' }).getByText('0 / 4', { exact: true })).toBeVisible();
  await expect(page.getByTestId('demo-banner')).toHaveCount(0);
  await page.getByRole('button', { name: 'Example data' }).click();
  await expect(page.getByRole('button', { name: 'Remove from watchlist', exact: true })).toBeVisible();
});
