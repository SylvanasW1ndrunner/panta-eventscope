'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CatalogPage, DataMode, Market, MarketQuery, ReadResult, Trade } from '../markets/model';

export type ReadError = { code: string; message: string; retryAt?: number };
export type ReadState<T> = { result?: ReadResult<T>; loading: boolean; error?: ReadError };
async function readLocal<T>(url: string, mode: DataMode, signal: AbortSignal): Promise<ReadResult<T>> {
  const response = await fetch(url, { signal, cache: 'no-store' });
  const body = await response.json();
  if (!response.ok) throw body.error ?? { code: 'READ_FAILED', message: 'This read could not be completed' };
  if (body.mode !== mode || !Number.isFinite(body.fetchedAt) || !('data' in body)) throw { code: 'BAD_RESPONSE', message: 'This read returned an unsupported response' };
  return body;
}
function readError(raw: unknown): ReadError {
  const error = raw as Partial<ReadError>;
  return { code: typeof error?.code === 'string' ? error.code : 'READ_FAILED',
    message: typeof error?.message === 'string' ? error.message : 'Connection interrupted. Try this read again.',
    ...(Number.isFinite(error?.retryAt) ? { retryAt: error.retryAt } : {}) };
}
export function useMarketData({ mode, query, activeId, watchedIds }: { mode: DataMode; query: MarketQuery; activeId: string; watchedIds: string[] }) {
  const [categories, setCategories] = useState<ReadState<string[]>>({ loading: true });
  const [catalog, setCatalog] = useState<ReadState<CatalogPage>>({ loading: true });
  const [details, setDetails] = useState<Record<string, ReadState<Market>>>({});
  const [trades, setTrades] = useState<ReadState<Trade[]>>({ loading: false });
  const [revision, setRevision] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [retryAt, setRetryAt] = useState(0);
  const pauseUntil = useRef(0);
  const generation = useRef(0);
  const moreController = useRef<AbortController | null>(null);
  const queryKey = JSON.stringify(query);
  const idsKey = [...new Set([activeId, ...watchedIds].filter(Boolean))].sort().join(',');
  const paused = (deadline?: number) => {
    if (deadline && deadline > pauseUntil.current) { pauseUntil.current = deadline; setRetryAt(deadline); }
  };
  useEffect(() => {
    pauseUntil.current = 0; setRetryAt(0); setDetails({});
    const controller = new AbortController();
    setCategories({ loading: true });
    readLocal<string[]>(`/api/categories?mode=${mode}`, mode, controller.signal)
      .then(result => { if (!controller.signal.aborted) setCategories({ result, loading: false }); })
      .catch(raw => { if (!controller.signal.aborted) { const error = readError(raw); paused(error.retryAt); setCategories({ error, loading: false }); } });
    return () => controller.abort();
  }, [mode]);
  useEffect(() => {
    const current = ++generation.current;
    const controller = new AbortController(); moreController.current?.abort(); setLoadingMore(false);
    setCatalog({ loading: true });
    const search = new URLSearchParams({ mode, limit: '20' });
    for (const [key, value] of Object.entries(JSON.parse(queryKey))) if (value !== undefined && value !== '') search.set(key, String(value));
    readLocal<CatalogPage>(`/api/markets?${search}`, mode, controller.signal)
      .then(result => { if (!controller.signal.aborted && current === generation.current) { paused(result.retryAt); setCatalog({ result, loading: false }); } })
      .catch(raw => { if (!controller.signal.aborted && current === generation.current) { const error = readError(raw); paused(error.retryAt); setCatalog({ error, loading: false }); } });
    return () => { controller.abort(); moreController.current?.abort(); };
  }, [mode, queryKey, revision]);
  useEffect(() => {
    const ids = idsKey.split(',').filter(Boolean);
    const controller = new AbortController();
    const refreshDetails = () => {
      if (Date.now() < pauseUntil.current || controller.signal.aborted) return;
      for (const id of ids) {
        setDetails(prev => ({ ...prev, [id]: { ...prev[id], loading: true } }));
        readLocal<Market>(`/api/markets/${id}?mode=${mode}`, mode, controller.signal)
          .then(result => {
            if (controller.signal.aborted || result.data.marketId !== id) return;
            paused(result.retryAt); setDetails(prev => ({ ...prev, [id]: { result, loading: false } }));
          })
          .catch(raw => {
            if (controller.signal.aborted) return;
            const error = readError(raw); paused(error.retryAt);
            setDetails(prev => ({ ...prev, [id]: { loading: false, error,
              ...(prev[id]?.result ? { result: { ...prev[id].result!, stale: true, ageMs: Date.now() - prev[id].result!.fetchedAt } } : {}) } }));
          });
      }
    };
    refreshDetails(); const interval = setInterval(refreshDetails, 30000);
    return () => { controller.abort(); clearInterval(interval); };
  }, [mode, idsKey, revision]);
  useEffect(() => {
    const controller = new AbortController(); setTrades({ loading: Boolean(activeId) });
    const refreshTrades = () => {
      if (!activeId || Date.now() < pauseUntil.current || controller.signal.aborted) return;
      setTrades(prev => ({ ...prev, loading: true }));
      readLocal<Trade[]>(`/api/markets/${activeId}/trades?mode=${mode}&limit=50`, mode, controller.signal)
        .then(result => { if (!controller.signal.aborted && result.data.every(row => row.marketId === activeId)) { paused(result.retryAt); setTrades({ result, loading: false }); } })
        .catch(raw => { if (!controller.signal.aborted) { const error = readError(raw); paused(error.retryAt); setTrades(prev => ({ ...prev, loading: false, error,
          ...(prev.result ? { result: { ...prev.result, stale: true, ageMs: Date.now() - prev.result.fetchedAt } } : {}) })); } });
    };
    refreshTrades(); const interval = setInterval(refreshTrades, 30000);
    return () => { controller.abort(); clearInterval(interval); };
  }, [activeId, mode, revision]);
  const loadMore = useCallback(async () => {
    const cursor = catalog.result?.data.nextCursor;
    if (!cursor || loadingMore || Date.now() < pauseUntil.current) return;
    const current = generation.current;
    const controller = new AbortController(); moreController.current = controller; setLoadingMore(true);
    const search = new URLSearchParams({ mode, cursor, limit: '20' });
    for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== '') search.set(key, String(value));
    try {
      const result = await readLocal<CatalogPage>(`/api/markets?${search}`, mode, controller.signal);
      if (controller.signal.aborted || current !== generation.current) return;
      paused(result.retryAt);
      setCatalog(prev => ({ loading: false, result: { ...result, data: { ...result.data,
        items: [...new Map([...(prev.result?.data.items ?? []), ...result.data.items].map(item => [item.marketId, item])).values()] } } }));
    } catch (raw) { if (!controller.signal.aborted && current === generation.current) { const error = readError(raw); paused(error.retryAt); setCatalog(prev => ({ ...prev, error })); } }
    finally { if (current === generation.current) setLoadingMore(false); }
  }, [catalog.result, loadingMore, mode, query]);
  return { categories, catalog, details, trades, loadingMore, loadMore, retryAt, refresh: () => { if (Date.now() >= pauseUntil.current) setRevision(x => x + 1); } };
}
