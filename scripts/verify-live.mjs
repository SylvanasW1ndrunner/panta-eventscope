import { createPantaClient } from '../src/server/panta/client.ts';
import { safeError } from '../src/server/panta/errors.ts';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function verifyPanta({ apiKey, accessConfirmed, fetchImpl = fetch, now = Date.now }) {
  const summary = { schemaVersion: 1, source: 'https://live-api.panta.market/api/v1/', checkedAt: now(), status: 'blocked', checks: [], reason: null };
  if (!apiKey?.trim()) { summary.reason = 'A legitimate server API key is required. No upstream reads were made.'; return summary; }
  if (!accessConfirmed) { summary.reason = 'Confirm free access and quota before enabling reads. No upstream reads were made.'; return summary; }
  const reader = createPantaClient({ apiKey, accessConfirmed, fetchImpl, now });
  try {
    const categories = await reader.categories();
    summary.checks.push({ resource: 'categories', fetchedAt: categories.fetchedAt, ok: true, count: categories.data.length });
    const catalogue = await reader.catalog({ limit: 1 });
    summary.checks.push({ resource: 'catalogue', fetchedAt: catalogue.fetchedAt, ok: true, count: catalogue.data.items.length });
    if (!catalogue.data.items.length) { summary.status = 'partial'; summary.reason = 'The catalogue is empty; detail and trade reads were not made.'; return summary; }
    const id = catalogue.data.items[0].marketId;
    const detail = await reader.market(id);
    summary.checks.push({ resource: 'detail', fetchedAt: detail.fetchedAt, ok: true, marketId: id, phase: detail.data.phase,
      yesQuoteAvailable: detail.data.yesPrice !== null, noQuoteAvailable: detail.data.noPrice !== null });
    const trades = await reader.trades(id, 50);
    summary.checks.push({ resource: 'trades', fetchedAt: trades.fetchedAt, ok: true, marketId: id, count: trades.data.length });
    summary.status = 'passed';
    if (detail.data.yesPrice === null || detail.data.noPrice === null) summary.reason = 'Four response contracts verified, but a spot quote was unavailable. Do not claim successful priced-market observation from this run.';
  } catch (error) { const safe = safeError(error); summary.status = 'failed'; summary.reason = safe.message; summary.errorCode = safe.code; }
  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const summary = await verifyPanta({ apiKey: process.env.PANTA_API_KEY ?? '', accessConfirmed: process.env.PANTA_FREE_ACCESS_CONFIRMED === 'true' });
  await mkdir('outputs/live-verification', { recursive: true });
  const file = `outputs/live-verification/${new Date(summary.checkedAt).toISOString().replace(/[:.]/g, '-')}.json`;
  await writeFile(file, JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify({ ...summary, evidenceFile: file }, null, 2));
  process.exitCode = summary.status === 'passed' ? 0 : 2;
}
