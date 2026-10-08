import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
test('captures a brief and exports the same source as JSON, Markdown and CSV', async ({ page }) => {
  await page.goto('/?mode=demo');
  await expect(page.getByRole('region', { name: 'Market research' }).getByText('64%', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Generate evidence brief' }).click();
  for (const format of ['JSON', 'Markdown', 'CSV']) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: `Download ${format}`, exact: true }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toContain('eventscope-demo-');
    const value = await readFile((await download.path())!, 'utf8');
    if (format === 'JSON') {
      const brief = JSON.parse(value);
      expect(brief.mode).toBe('demo'); expect(brief.quotes.yes).toBe('0.64');
      expect(brief.evidence.every((row: { explorerUrl: string | null }) => row.explorerUrl === null)).toBe(true);
      await expect(page.getByText(`Source read: ${new Date(brief.observedAt).toISOString()}`, { exact: true })).toBeVisible();
    } else expect(value).toContain(format === 'Markdown' ? 'FICTIONAL EXAMPLE' : 'demo');
  }
  await expect(page.getByRole('region', { name: 'Trade evidence' }).getByRole('link')).toHaveCount(0);
});
test('requires a new capture when the selected event changes', async ({ page }) => {
  await page.goto('/?mode=demo');
  await page.getByRole('button', { name: 'Generate evidence brief' }).click();
  await expect(page.getByRole('button', { name: 'Download JSON' })).toBeVisible();
  await page.getByRole('button', { name: /Open market: Will SOL/ }).click();
  await expect(page.getByRole('button', { name: 'Download JSON' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Generate evidence brief' }).click();
  await expect(page.getByRole('region', { name: 'Evidence brief' }).getByText('38%', { exact: true })).toBeVisible();
});
