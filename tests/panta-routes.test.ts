import { describe, expect, it } from 'vitest';
import { createRouteHandlers } from '../src/server/panta/routes';
import { createPantaClient } from '../src/server/panta/client';
import { marketId, NOW } from './fixtures/panta';

const routes = () => createRouteHandlers(createPantaClient({ apiKey: '', accessConfirmed: false, now: () => NOW }));
const req = (path: string, method = 'GET') => new Request(`http://localhost/api/${path}`, { method });
describe('local read routes', () => {
  it('keeps live failures live and private', async () => {
    const response = await routes().catalog(req('markets?mode=live'));
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe('NOT_CONFIGURED');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
  it('offers fictional data only in explicitly requested demo mode', async () => {
    const response = await routes().catalog(req('markets?mode=demo&limit=2'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.mode).toBe('demo');
    expect(body.data.items).toHaveLength(2);
    expect(body.data.nextCursor).toBeTruthy();
    expect(body.warnings.join(' ')).toMatch(/fictional/i);
    const detail = await routes().market(req('markets?mode=demo'), body.data.items[0].marketId);
    expect((await detail.json()).data.yesPrice).not.toBeNull();
  });
  it('supports bounded filtered pagination in demo', async () => {
    const first = await (await routes().catalog(req('markets?mode=demo&limit=1&category=science'))).json();
    const next = await (await routes().catalog(req(`markets?mode=demo&limit=1&category=science&cursor=${encodeURIComponent(first.data.nextCursor)}`))).json();
    expect(next.data.items[0].marketId).not.toBe(first.data.items[0].marketId);
  });
  it.each(['mode=unknown', 'mode=demo&limit=51', 'mode=demo&limit=1.5', 'mode=demo&status=bad', 'mode=demo&url=https://elsewhere.test', 'mode=demo&mode=live'])('rejects unsupported query %s', async query => {
    expect((await routes().catalog(req(`markets?${query}`))).status).toBe(400);
  });
  it('rejects non-GET methods and unsafe identifiers', async () => {
    expect((await routes().catalog(req('markets?mode=demo', 'POST'))).status).toBe(405);
    expect((await routes().market(req('markets?mode=demo'), '../account')).status).toBe(400);
    expect((await routes().trades(req('markets?mode=demo&limit=201'), marketId)).status).toBe(400);
  });
  it('does not share catalogue query parameters with detail endpoints', async () => {
    expect((await routes().market(req('markets?mode=demo&category=science'), marketId)).status).toBe(400);
  });
  it('returns distinct categories and a bounded trade tape', async () => {
    const handlers = routes();
    const categories = await (await handlers.categories(req('categories?mode=demo'))).json();
    expect(categories.data).toContain('science');
    const page = await (await handlers.catalog(req('markets?mode=demo'))).json();
    const trades = await (await handlers.trades(req('markets?mode=demo&limit=1'), page.data.items[0].marketId)).json();
    expect(trades.mode).toBe('demo');
    expect(trades.data).toHaveLength(1);
  });
});
