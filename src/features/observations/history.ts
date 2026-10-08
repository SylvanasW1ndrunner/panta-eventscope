import type { Snapshot } from './model';
import { normalizePrice } from '../markets/prices';
import { isValidMarketId } from '../markets/parse';
export const MAX_GAP_MS = 90000;
const RETENTION_MS = 7 * 86400000;
export function normalizeSnapshot(raw: unknown, now: number): Snapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Snapshot;
  if (!isValidMarketId(row.marketId) || !['live', 'demo'].includes(row.mode)
    || !['primary', 'secondary', 'resolved', 'cancelled', 'unknown'].includes(row.phase)
    || !Number.isSafeInteger(row.observedAt) || row.observedAt < now - RETENTION_MS || row.observedAt > now + 60000) return null;
  return { marketId: row.marketId, mode: row.mode, phase: row.phase, observedAt: row.observedAt,
    yesPrice: normalizePrice(row.yesPrice), noPrice: normalizePrice(row.noPrice) };
}
export function appendSnapshot(history: Snapshot[], sample: Snapshot, now: number): Snapshot[] {
  const entries = new Map<number, Snapshot>();
  for (const raw of [...history, sample]) {
    const row = normalizeSnapshot(raw, now);
    if (row && row.marketId === sample.marketId && row.mode === sample.mode && !entries.has(row.observedAt)) entries.set(row.observedAt, row);
  }
  return [...entries.values()].sort((a, b) => a.observedAt - b.observedAt).slice(-500);
}
export function historySegments(history: Snapshot[]): Snapshot[][] {
  const result: Snapshot[][] = [];
  let previous: Snapshot | null = null;
  for (const sample of [...history].sort((a, b) => a.observedAt - b.observedAt)) {
    if (normalizePrice(sample.yesPrice) === null || sample.phase === 'unknown') { previous = null; continue; }
    if (!previous || previous.phase !== sample.phase || previous.mode !== sample.mode || previous.marketId !== sample.marketId
      || sample.observedAt - previous.observedAt > MAX_GAP_MS) result.push([]);
    result.at(-1)!.push(sample); previous = sample;
  }
  return result;
}
