import type { PantaClient } from './client';
import { validateId, validateQuery, validateTradeLimit } from './client';
import { PantaError, safeError } from './errors';
import { demoResult, demoMarkets, demoCatalog, demoMarket, demoTrades } from '../../demo/markets';
import type { DataMode, MarketQuery } from '../../features/markets/model';

const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
function params(req: Request, allowed: string[]): { mode: DataMode; search: URLSearchParams } {
  const search = new URL(req.url).searchParams;
  for (const key of search.keys()) if (!['mode', ...allowed].includes(key) || search.getAll(key).length !== 1) throw new PantaError('INVALID_PARAMS');
  const mode = search.get('mode') ?? 'live';
  if (mode !== 'demo' && mode !== 'live') throw new PantaError('INVALID_PARAMS');
  return { mode, search };
}
function integer(search: URLSearchParams, key: string, fallback: number): number {
  const value = search.get(key);
  if (value === null) return fallback;
  if (!/^\d+$/.test(value) || value.length > 3) throw new PantaError('INVALID_PARAMS');
  return Number(value);
}
function wrap(work: (req: Request, id?: string) => Promise<unknown>) {
  return async (req: Request, id?: string): Promise<Response> => {
    if (req.method !== 'GET') return Response.json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET reads are available' } }, { status: 405, headers: { ...headers, Allow: 'GET' } });
    try { return Response.json(await work(req, id), { headers }); }
    catch (error) {
      const safe = safeError(error);
      return Response.json({ error: { code: safe.code, message: safe.message, ...(safe.retryAt ? { retryAt: safe.retryAt } : {}) } }, { status: safe.status, headers });
    }
  };
}
export function createRouteHandlers(client: PantaClient) {
  return {
    categories: wrap(async req => {
      const { mode } = params(req, []);
      return mode === 'demo' ? demoResult([...new Set(demoMarkets.map(m => m.category))]) : client.categories();
    }),
    catalog: wrap(async req => {
      const { mode, search } = params(req, ['category', 'status', 'cursor', 'limit']);
      const query = validateQuery({ category: search.get('category') ?? undefined, status: (search.get('status') ?? undefined) as MarketQuery['status'], cursor: search.get('cursor') ?? undefined, limit: integer(search, 'limit', 20) });
      return mode === 'demo' ? demoResult(demoCatalog(query)) : client.catalog(query);
    }),
    market: wrap(async (req, id) => {
      const { mode } = params(req, []); validateId(id ?? '');
      return mode === 'demo' ? demoResult(demoMarket(id!)) : client.market(id!);
    }),
    trades: wrap(async (req, id) => {
      const { mode, search } = params(req, ['limit']); validateId(id ?? '');
      const limit = integer(search, 'limit', 50); validateTradeLimit(limit);
      return mode === 'demo' ? demoResult(demoTrades(id!, limit)) : client.trades(id!, limit);
    }),
  };
}
