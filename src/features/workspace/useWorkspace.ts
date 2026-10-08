'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DataMode, Market, ReadResult } from '../markets/model';
import type { SavedWorkspace, AlertState } from '../observations/model';
import { appendSnapshot } from '../observations/history';
import { evaluateAlert } from '../observations/alerts';
import { emptyWorkspace, loadWorkspace, saveWorkspace } from '../observations/storage';
import { enqueueNotifications, type MovementNotification, type NotificationQueue } from '../observations/notifications';
import { shortId } from '../markets/format';

export function useWorkspace(mode: DataMode) {
  const [workspace, setWorkspace] = useState<SavedWorkspace>(emptyWorkspace);
  const [loadedMode, setLoadedMode] = useState<DataMode | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationQueue>({ items: [], overflow: 0 });
  const marketTitles = useRef<Record<string, string>>({});
  const alertStates = useRef<Record<string, AlertState>>({});
  useEffect(() => {
    let loaded: SavedWorkspace;
    try { loaded = loadWorkspace(window.localStorage, mode); }
    catch { loaded = { ...emptyWorkspace(), storageNotice: 'Workspace is unsaved: browser storage is unavailable.' }; }
    setWorkspace(loaded); setNotice(loaded.storageNotice ?? null); setLoadedMode(mode); setNotifications({ items: [], overflow: 0 }); alertStates.current = {}; marketTitles.current = {};
  }, [mode]);
  useEffect(() => {
    if (loadedMode !== mode) return;
    try { const result = saveWorkspace(window.localStorage, mode, workspace); if (!result.saved) setNotice(result.notice); }
    catch { setNotice('Workspace is unsaved: browser storage is unavailable.'); }
  }, [workspace, mode, loadedMode]);
  const record = useCallback((read: ReadResult<Market>) => {
    if (read.mode !== mode || loadedMode !== mode || read.stale) return;
    marketTitles.current[read.data.marketId] = read.data.title;
    setWorkspace(prev => {
      const id = read.data.marketId; const old = prev.histories[id] ?? [];
      if (old.some(s => s.observedAt === read.fetchedAt)) return prev;
      const history = appendSnapshot(old, { marketId: id, mode, phase: read.data.phase, observedAt: read.fetchedAt,
        yesPrice: read.data.yesPrice, noPrice: read.data.noPrice }, Date.now());
      return { ...prev, histories: { ...prev.histories, [id]: history } };
    });
  }, [mode, loadedMode]);
  useEffect(() => {
    if (loadedMode !== mode) return;
    const incoming: MovementNotification[] = [];
    for (const id of workspace.watchlist) {
      const result = evaluateAlert(alertStates.current[id] ?? { crossing: false, lastEmittedAt: null }, workspace.histories[id] ?? [], workspace.thresholdPp, Date.now());
      alertStates.current[id] = result.state;
      if (result.triggered && result.direction && result.deltaPp && result.state.lastEmittedAt !== null) {
        incoming.push({ id: `${id}:${result.state.lastEmittedAt}`, marketId: id, title: marketTitles.current[id] || shortId(id),
          observedAt: result.state.lastEmittedAt, deltaPp: result.deltaPp, direction: result.direction });
      }
    }
    if (incoming.length) setNotifications(prev => enqueueNotifications(prev, incoming));
  }, [workspace.histories, workspace.watchlist, workspace.thresholdPp, loadedMode, mode]);
  const toggleWatch = (id: string) => setWorkspace(prev => {
    if (prev.watchlist.includes(id)) return { ...prev, watchlist: prev.watchlist.filter(x => x !== id), compare: prev.compare.filter(x => x !== id) };
    if (prev.watchlist.length >= 4) { setNotice('Watchlist is full. Remove a market before adding another.'); return prev; }
    return { ...prev, watchlist: [...prev.watchlist, id] };
  });
  const toggleCompare = (id: string) => setWorkspace(prev => ({ ...prev, compare: prev.compare.includes(id) ? prev.compare.filter(x => x !== id)
    : prev.compare.length < 3 && prev.watchlist.includes(id) ? [...prev.compare, id] : prev.compare }));
  return { workspace: loadedMode === mode ? workspace : emptyWorkspace(), notice, notifications: loadedMode === mode ? notifications : { items: [], overflow: 0 }, record, toggleWatch, toggleCompare,
    setThreshold: (value: number) => { if (Number.isFinite(value) && value >= 1 && value <= 20) { alertStates.current = {}; setWorkspace(prev => ({ ...prev, thresholdPp: value })); } },
    clearHistory: () => { alertStates.current = {}; setWorkspace(prev => ({ ...prev, histories: {} })); setNotifications({ items: [], overflow: 0 }); },
    dismissAlert: (id: string) => setNotifications(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) })),
    dismissOverflow: () => setNotifications(prev => ({ ...prev, overflow: 0 })), dismissNotice: () => setNotice(null) };
}
