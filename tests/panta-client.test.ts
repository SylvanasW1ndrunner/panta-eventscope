import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPantaClient } from '../src/server/panta/client';
import { marketId, secondId, rawMarket, rawTrade, NOW } from './fixtures/panta';

const secret = 'pk_test_not-a-real-secret';
const json = (data: unknown) => new Response(JSON.stringify(data));
afterEach(() => vi.useRealTimers());
describe('server Panta reader', () => {
  it.each([[120, 30], [30, 120]])('keeps the longest concurrent Retry-After: %j', async (first, second) => {
    let time = NOW;
    const release: ((response: Response) => void)[] = [];
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(() => fetchImpl.mock.calls.length <= 2
      ? new Promise<Response>(resolve => release.push(resolve)) : Promise.resolve(json({ categories: ['science'] })));
    const client = createPantaClient({ fetchImpl, now: () => time, apiKey: secret });
    const a = client.market(marketId).catch(error => error);
    const b = client.market(secondId).catch(error => error);
    release[0](new Response(null, { status: 429, headers: { 'Retry-After': String(first) } }));
    await a;
    release[1](new Response(null, { status: 429, headers: { 'Retry-After': String(second) } }));
    await b;
    time += 31000;
    await expect(client.categories()).rejects.toMatchObject({ code: 'RATE_LIMITED', retryAt: NOW + 120000 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    time = NOW + 120000;
    expect((await client.categories()).data).toEqual(['science']);
  });
  it('makes no upstream call without a key', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const client = createPantaClient({ fetchImpl, now: () => NOW, apiKey: '' });
    await expect(client.categories()).rejects.toMatchObject({ code: 'NOT_CONFIGURED' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it('reads live categories with an API key alone', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(json({ categories: ['science'] }));
    const client = createPantaClient({ fetchImpl, now: () => NOW, apiKey: secret });
    await expect(client.categories()).resolves.toMatchObject({ mode: 'live', data: ['science'], fetchedAt: NOW });
  });
  it('uses only the fixed authenticated GET origin', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(json(rawMarket));
    const client = createPantaClient({ fetchImpl, now: () => NOW, apiKey: secret });
    const result = await client.market(marketId);
    expect(result.data.title).toBe(rawMarket.title);
    expect(result.mode).toBe('live');
    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toBe(`https://live-api.panta.market/api/v1/markets/${marketId}/`);
    expect(init?.method).toBe('GET');
    expect(init?.redirect).toBe('error');
    expect(new Headers(init?.headers).get('X-Api-Key')).toBe(secret);
    expect(JSON.stringify(result)).not.toContain(secret);
  });
  it('validates IDs and parameter bounds before requesting', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const client = createPantaClient({ fetchImpl, now: () => NOW, apiKey: secret });
    await expect(client.market('../account')).rejects.toMatchObject({ code: 'INVALID_PARAMS' });
    await expect(client.catalog({ limit: 51 })).rejects.toMatchObject({ code: 'INVALID_PARAMS' });
    await expect(client.catalog({ status: 'admin' as never })).rejects.toMatchObject({ code: 'INVALID_PARAMS' });
    await expect(client.catalog({ category: 'a&createdBy=me' })).rejects.toMatchObject({ code: 'INVALID_PARAMS' });
    await expect(client.trades(marketId, 201)).rejects.toMatchObject({ code: 'INVALID_PARAMS' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it.each([
    ['market', 15000], ['trades', 30000], ['catalog', 60000], ['categories', 60000],
  ] as const)('expires %s exactly at its cache deadline', async (resource, ttl) => {
    let time = NOW;
    const body = resource === 'market' ? rawMarket : resource === 'trades' ? { marketId, items: [rawTrade] }
      : resource === 'catalog' ? { items: [rawMarket], nextCursor: null } : { categories: ['science'] };
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async () => json(body));
    const client = createPantaClient({ fetchImpl, now: () => time, apiKey: secret });
    const read = () => resource === 'market' ? client.market(marketId) : resource === 'trades' ? client.trades(marketId, 50)
      : resource === 'catalog' ? client.catalog({}) : client.categories();
    const first = await read();
    time += ttl - 1;
    expect((await read()).fetchedAt).toBe(first.fetchedAt);
    time += 1;
    expect((await read()).fetchedAt).toBe(time);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
  it('coalesces pending identical requests and preserves the read timestamp', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async () => json(rawMarket));
    const client = createPantaClient({ fetchImpl, now: () => NOW, apiKey: secret });
    const [a, b] = await Promise.all([client.market(marketId), client.market(marketId)]);
    expect(a.fetchedAt).toBe(b.fetchedAt);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it('limits active upstream reads to two and drains queued reads', async () => {
    let active = 0; let peak = 0;
    const release: (() => void)[] = [];
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async () => {
      active++; peak = Math.max(peak, active);
      await new Promise<void>(resolve => release.push(resolve));
      active--;
      return json({ items: [], nextCursor: null });
    });
    const client = createPantaClient({ fetchImpl, now: () => NOW, apiKey: secret });
    const reads = [client.catalog({ category: 'science' }), client.catalog({ category: 'crypto' }), client.catalog({ category: 'sports' })].map(p => p.catch(e => e));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(active).toBe(2);
    release.splice(0).forEach(fn => fn());
    await new Promise(resolve => setTimeout(resolve, 0));
    release.splice(0).forEach(fn => fn());
    const results = await Promise.all(reads);
    expect(peak).toBe(2);
    expect(results).toHaveLength(3);
    expect(results.every(result => !(result instanceof Error))).toBe(true);
  });
  it('retains stale data and its original read time after a failed refresh', async () => {
    let time = NOW;
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(json(rawMarket)).mockResolvedValueOnce(new Response(secret, { status: 500 }));
    const client = createPantaClient({ fetchImpl, now: () => time, apiKey: secret });
    await client.market(marketId);
    time += 16000;
    const result = await client.market(marketId);
    expect(result.stale).toBe(true);
    expect(result.ageMs).toBe(16000);
    expect(result.fetchedAt).toBe(NOW);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(JSON.stringify(result)).not.toContain(secret);
  });
  it('does not leak raw authentication errors', async () => {
    const client = createPantaClient({ fetchImpl: async () => new Response(secret, { status: 401 }), now: () => NOW, apiKey: secret });
    const error = await client.market(marketId).catch(e => e);
    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.message).not.toContain(secret);
  });
  it('rejects invalid JSON and mismatched market identifiers', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('{broken')).mockResolvedValueOnce(json({ ...rawMarket, marketId: secondId }));
    const client = createPantaClient({ fetchImpl, now: () => NOW, apiKey: secret });
    await expect(client.market(marketId)).rejects.toMatchObject({ code: 'BAD_RESPONSE' });
    await expect(client.market(marketId)).rejects.toMatchObject({ code: 'BAD_RESPONSE' });
  });
  it('honours Retry-After across resources without retrying', async () => {
    let time = NOW;
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('limited', { status: 429, headers: { 'Retry-After': '120' } })).mockResolvedValueOnce(json({ categories: ['science'] }));
    const client = createPantaClient({ fetchImpl, now: () => time, apiKey: secret });
    await expect(client.market(marketId)).rejects.toMatchObject({ code: 'RATE_LIMITED', retryAt: NOW + 120000 });
    time += 60000;
    await expect(client.categories()).rejects.toMatchObject({ code: 'RATE_LIMITED', retryAt: NOW + 120000 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    time += 60000;
    expect((await client.categories()).data).toEqual(['science']);
  });
  it('times out a stalled response after eight seconds', async () => {
    vi.useFakeTimers();
    const client = createPantaClient({ fetchImpl: () => new Promise(() => {}), now: () => NOW, apiKey: secret });
    const pending = client.categories().catch(e => e);
    await vi.advanceTimersByTimeAsync(8001);
    expect((await pending).code).toBe('TIMEOUT');
  });
});
