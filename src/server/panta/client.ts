import type { MarketQuery, Market, Trade, CatalogPage, ReadResult } from '../../features/markets/model';
import { isValidMarketId, parseMarket, parseCatalog, parseTrades, phases, record } from '../../features/markets/parse';
import { PantaError, safeError } from './errors';
import { ReadCache, cachedView } from './cache';
export type PantaClient = {
  categories(): Promise<ReadResult<string[]>>;
  catalog(query: MarketQuery): Promise<ReadResult<CatalogPage>>;
  market(id: string): Promise<ReadResult<Market>>;
  trades(id: string, limit: number): Promise<ReadResult<Trade[]>>;
};
// accessConfirmed enables configured reads; it does not establish provider pricing.
export type ClientOptions = { fetchImpl?: typeof fetch; now?: () => number; apiKey: string; accessConfirmed: boolean };
export function validateQuery(query: MarketQuery): MarketQuery {
  const { category, status, cursor, limit = 20 } = query;
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new PantaError('INVALID_PARAMS');
  if (category !== undefined && !/^[a-z][a-z0-9_-]{0,63}$/.test(category)) throw new PantaError('INVALID_PARAMS');
  if (status !== undefined && !phases.includes(status)) throw new PantaError('INVALID_PARAMS');
  if (cursor !== undefined && (cursor.length < 1 || cursor.length > 512 || /[\x00-\x1f\x7f]/.test(cursor))) throw new PantaError('INVALID_PARAMS');
  return { category, status, cursor, limit };
}
export function validateId(id: string) { if (!isValidMarketId(id)) throw new PantaError('INVALID_PARAMS'); }
export function validateTradeLimit(limit: number) { if (!Number.isInteger(limit) || limit < 1 || limit > 200) throw new PantaError('INVALID_PARAMS'); }

export function createPantaClient({ fetchImpl = fetch, now = Date.now, apiKey, accessConfirmed }: ClientOptions): PantaClient {
  const cache = new ReadCache();
  const pending = new Map<string, Promise<ReadResult<unknown>>>();
  let active = 0;
  let retryAt = 0;
  const queue: (() => void)[] = [];
  async function limited<T>(work: () => Promise<T>): Promise<T> {
    if (active >= 2) await new Promise<void>(resolve => queue.push(resolve));
    else active++;
    try { return await work(); }
    finally {
      const next = queue.shift();
      if (next) next(); // Transfer the occupied slot, without briefly freeing it.
      else active--;
    }
  }
  function configured() {
    if (!apiKey.trim()) throw new PantaError('NOT_CONFIGURED');
    if (!accessConfirmed) throw new PantaError('ACCESS_UNCONFIRMED');
  }
  async function read<T>(path: string, ttl: number, parse: (raw: unknown) => T): Promise<ReadResult<T>> {
    configured();
    const entry = cache.get<T>(path);
    if (entry && now() - entry.fetchedAt < ttl) return cachedView(entry, now());
    const existing = pending.get(path);
    if (existing) return existing as Promise<ReadResult<T>>;
    const request = limited(async (): Promise<ReadResult<T>> => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const controller = new AbortController();
      try {
        if (now() < retryAt) throw new PantaError('RATE_LIMITED', retryAt);
        const timeout = new Promise<never>((_, reject) => {
          timer = setTimeout(() => { controller.abort(); reject(new PantaError('TIMEOUT')); }, 8000);
        });
        const operation = async () => {
          const response = await fetchImpl(`https://live-api.panta.market/api/v1/${path}`, {
            method: 'GET', headers: { 'X-Api-Key': apiKey, Accept: 'application/json' },
            redirect: 'error', cache: 'no-store', signal: controller.signal,
          });
          if (response.redirected || (response.status >= 300 && response.status < 400)) throw new PantaError('BAD_RESPONSE');
          if (response.status === 429) {
            const header = response.headers.get('Retry-After');
            const seconds = header !== null && /^\d+$/.test(header) ? Number(header) : null;
            const date = header ? Date.parse(header) : NaN;
            const deadline = now() + (seconds !== null && Number.isFinite(seconds) ? Math.max(1000, seconds * 1000)
              : Number.isFinite(date) ? Math.max(1000, date - now()) : 60000);
            retryAt = Math.max(retryAt, deadline);
            throw new PantaError('RATE_LIMITED', retryAt);
          }
          if (!response.ok) throw new PantaError(response.status === 401 ? 'UNAUTHORIZED' : response.status === 403 ? 'FORBIDDEN'
            : response.status === 404 ? 'NOT_FOUND' : response.status === 400 ? 'INVALID_PARAMS' : 'UPSTREAM_UNAVAILABLE');
          // Refuse oversized payloads before parsing; never retain raw error bodies.
          if (Number(response.headers.get('Content-Length') || 0) > 2_000_000) throw new PantaError('BAD_RESPONSE');
          const reader = response.body?.getReader();
          const chunks: Uint8Array[] = [];
          let size = 0;
          if (reader) {
            try {
              while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                size += value.length;
                if (size > 2_000_000) { await reader.cancel(); throw new PantaError('BAD_RESPONSE'); }
                chunks.push(value);
              }
            } finally { reader.releaseLock(); }
          }
          const bytes = new Uint8Array(size); let offset = 0;
          for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
          let data: T;
          try { data = parse(JSON.parse(new TextDecoder().decode(bytes))); }
          catch { throw new PantaError('BAD_RESPONSE'); }
          const item = { data, fetchedAt: now(), ttl };
          cache.put(path, item);
          return cachedView(item, now());
        };
        return await Promise.race([operation(), timeout]);
      } catch (error) {
        const safe = controller.signal.aborted ? new PantaError('TIMEOUT') : safeError(error);
        if (entry) return cachedView(entry, now(), true, [safe.message], safe.retryAt);
        throw safe;
      } finally { if (timer) clearTimeout(timer); }
    });
    pending.set(path, request);
    try { return await request; } finally { pending.delete(path); }
  }
  return {
    categories: () => read('categories/', 60000, raw => {
      const root = record(raw);
      if (!Array.isArray(root.categories) || root.categories.length > 100 || root.categories.some(x => typeof x !== 'string' || !/^[a-z][a-z0-9_-]{0,63}$/.test(x))) throw new Error('Invalid categories');
      return [...new Set(root.categories as string[])];
    }),
    catalog: async query => {
      const valid = validateQuery(query);
      const search = new URLSearchParams();
      for (const [key, value] of Object.entries(valid)) if (value !== undefined) search.set(key, String(value));
      return read(`markets/?${search.toString()}`, 60000, parseCatalog);
    },
    market: async id => {
      validateId(id);
      return read(`markets/${id}/`, 15000, raw => {
        const result = parseMarket(raw);
        if (result.marketId !== id) throw new Error('Mismatched market');
        return result;
      });
    },
    trades: async (id, limit) => {
      validateId(id); validateTradeLimit(limit);
      return read(`markets/${id}/trades/?limit=${limit}`, 30000, raw => {
        if (record(raw).marketId !== id) throw new Error('Mismatched market');
        return parseTrades(raw);
      });
    },
  };
}
