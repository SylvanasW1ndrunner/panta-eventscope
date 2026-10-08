import { describe, expect, it } from 'vitest';
import bs58 from 'bs58';
import { appendSnapshot, historySegments } from '../src/features/observations/history';
import { loadWorkspace, saveWorkspace, emptyWorkspace } from '../src/features/observations/storage';
import { makeSnapshot, marketId, NOW } from './fixtures/panta';

const memoryStorage = () => {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
};
describe('observations', () => {
  it('does not turn cached reads into new observations', () => {
    const snapshot = makeSnapshot();
    expect(appendSnapshot([snapshot], snapshot, NOW)).toHaveLength(1);
  });
  it('sorts actual timestamps and separates market/source identities', () => {
    const previous = makeSnapshot({ observedAt: NOW - 30000 });
    const history = appendSnapshot([makeSnapshot(), makeSnapshot({ mode: 'demo' })], previous, NOW);
    expect(history.map(s => s.observedAt)).toEqual([NOW - 30000, NOW]);
    expect(history.every(s => s.mode === 'live')).toBe(true);
  });
  it('retains no more than 500 samples within seven days', () => {
    const samples = Array.from({ length: 500 }, (_, i) => makeSnapshot({ observedAt: NOW - (500 - i) * 30000 }));
    const history = appendSnapshot([makeSnapshot({ observedAt: NOW - 8 * 86400000 }), ...samples], makeSnapshot(), NOW);
    expect(history).toHaveLength(500);
    expect(history[0].observedAt).toBe(NOW - 499 * 30000);
    expect(history.at(-1)?.observedAt).toBe(NOW);
  });
  it('rejects corrupt/far-future observations and keeps a real zero', () => {
    expect(appendSnapshot([], makeSnapshot({ observedAt: NOW + 86400000 }), NOW)).toEqual([]);
    expect(appendSnapshot([], makeSnapshot({ yesPrice: '0' }), NOW)[0].yesPrice).toBe('0');
    expect(appendSnapshot([], makeSnapshot({ yesPrice: '999' }), NOW)[0].yesPrice).toBeNull();
  });
  it('splits charts at missing quotes, phase changes and observation gaps', () => {
    const history = [
      makeSnapshot({ observedAt: NOW - 150000 }), makeSnapshot({ observedAt: NOW - 120000 }),
      makeSnapshot({ observedAt: NOW - 90000, yesPrice: null }),
      makeSnapshot({ observedAt: NOW - 60000 }), makeSnapshot({ observedAt: NOW - 30000, phase: 'primary' }),
      makeSnapshot({ observedAt: NOW + 100000, phase: 'primary' }),
    ];
    expect(historySegments(history).map(segment => segment.length)).toEqual([2, 1, 1, 1]);
    expect(historySegments([makeSnapshot()])[0]).toHaveLength(1);
  });
});
describe('workspace persistence', () => {
  it('isolates live and fictional workspaces', () => {
    const storage = memoryStorage();
    const workspace = { ...emptyWorkspace(), watchlist: [marketId] };
    expect(saveWorkspace(storage, 'demo', workspace).saved).toBe(true);
    expect(loadWorkspace(storage, 'live').watchlist).toEqual([]);
    expect(loadWorkspace(storage, 'demo').watchlist).toEqual([marketId]);
  });
  it('handles corrupt JSON and unknown versions without crashing', () => {
    for (const value of ['{bad', JSON.stringify({ version: 99, watchlist: [marketId] })]) {
      const loaded = loadWorkspace({ getItem: () => value }, 'live');
      expect(loaded.watchlist).toEqual([]);
      expect(loaded.storageNotice).toMatch(/reset/i);
    }
  });
  it('reports unavailable browser storage while preserving an in-memory workspace', () => {
    const storage = { getItem: () => { throw new Error('Denied'); }, setItem: () => { throw new Error('Denied'); } };
    expect(loadWorkspace(storage, 'live').storageNotice).toMatch(/unsaved/i);
    expect(saveWorkspace(storage, 'live', emptyWorkspace()).saved).toBe(false);
  });
  it('enforces watch and compare limits when loading untrusted local records', () => {
    const ids = Array.from({ length: 5 }, (_, i) => bs58.encode(new Uint8Array(32).fill(i + 1)));
    const storage = memoryStorage();
    saveWorkspace(storage, 'live', { ...emptyWorkspace(), watchlist: ids, compare: ids, thresholdPp: 200 });
    const loaded = loadWorkspace(storage, 'live');
    expect(loaded.watchlist).toHaveLength(4);
    expect(loaded.compare).toHaveLength(3);
    expect(loaded.thresholdPp).toBe(5);
  });
  it('prunes expired history and mixed source modes during loading', () => {
    const storage = memoryStorage();
    saveWorkspace(storage, 'live', { ...emptyWorkspace(), histories: { [marketId]: [makeSnapshot({ observedAt: Date.now(), mode: 'demo' })] } });
    expect(loadWorkspace(storage, 'live').histories[marketId] ?? []).toEqual([]);
  });
});
