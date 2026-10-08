import type { DataMode } from '../markets/model';
import type { SavedWorkspace, Snapshot, StorageResult } from './model';
import { normalizeSnapshot } from './history';
import { isValidMarketId } from '../markets/parse';
export const emptyWorkspace = (): SavedWorkspace => ({ version: 1, watchlist: [], compare: [], histories: {}, thresholdPp: 5 });
const key = (mode: DataMode) => `eventscope:v1:${mode}`;
function sanitize(raw: SavedWorkspace, mode: DataMode): SavedWorkspace {
  const uniqueIds = (values: unknown, max: number) => Array.isArray(values) ? [...new Set(values.filter(isValidMarketId))].slice(0, max) : [];
  const watchlist = uniqueIds(raw.watchlist, 4);
  const compare = uniqueIds(raw.compare, 3).filter(id => watchlist.includes(id));
  const histories: Record<string, Snapshot[]> = {};
  const now = Date.now();
  if (raw.histories && typeof raw.histories === 'object' && !Array.isArray(raw.histories)) {
    for (const [id, samples] of Object.entries(raw.histories)) {
      if (!isValidMarketId(id) || !Array.isArray(samples)) continue;
      const clean = new Map<number, Snapshot>();
      for (const sample of samples.slice(-1000)) {
        const item = normalizeSnapshot(sample, now);
        if (item && item.marketId === id && item.mode === mode && !clean.has(item.observedAt)) clean.set(item.observedAt, item);
      }
      histories[id] = [...clean.values()].sort((a, b) => a.observedAt - b.observedAt).slice(-500);
    }
  }
  return { version: 1, watchlist, compare, histories, thresholdPp: Number.isFinite(raw.thresholdPp) && raw.thresholdPp >= 1 && raw.thresholdPp <= 20 ? raw.thresholdPp : 5 };
}
export function loadWorkspace(storage: Pick<Storage, 'getItem'>, mode: DataMode): SavedWorkspace {
  let raw: string | null;
  try { raw = storage.getItem(key(mode)); }
  catch { return { ...emptyWorkspace(), storageNotice: 'Workspace is unsaved: browser storage is unavailable.' }; }
  if (raw === null) return emptyWorkspace();
  try {
    if (raw.length > 3_000_000) throw new Error('Too much stored data');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) throw new Error('Unsupported version');
    return sanitize(parsed, mode);
  } catch { return { ...emptyWorkspace(), storageNotice: 'Saved workspace was reset because its format was unsupported or damaged.' }; }
}
export function saveWorkspace(storage: Pick<Storage, 'setItem'>, mode: DataMode, workspace: SavedWorkspace): StorageResult {
  try {
    const value = JSON.stringify(sanitize(workspace, mode));
    if (value.length > 3_000_000) throw new Error('Storage size limit');
    storage.setItem(key(mode), value);
    return { saved: true, notice: null };
  } catch { return { saved: false, notice: 'Workspace is unsaved: browser storage is unavailable or full. You can keep researching and export your brief.' }; }
}
