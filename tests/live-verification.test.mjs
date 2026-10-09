import { describe, expect, it, vi } from 'vitest';
import { verifyPanta } from '../scripts/verify-live.mjs';
import { NOW, rawMarket, rawTrade, marketId } from './fixtures/panta.ts';
const key = 'pk_test_verification-fixture';
describe('live validation preconditions and read evidence', () => {
  it('makes no requests without configured access', async () => {
    const fetchImpl = vi.fn();
    const result = await verifyPanta({ apiKey: '', accessConfirmed: false, fetchImpl, now: () => NOW });
    expect(result.status).toBe('blocked'); expect(result.checks).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it('makes no requests when live reads are disabled', async () => {
    const fetchImpl = vi.fn();
    const result = await verifyPanta({ apiKey: key, accessConfirmed: false, fetchImpl, now: () => NOW });
    expect(result.status).toBe('blocked'); expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.readAccessEnabled).toBe(false);
    expect(result.freeQuotaVerified).toBe(false);
  });
  it('verifies exactly the four read resources and retains their actual read times', async () => {
    const fetchImpl = vi.fn(async url => {
      const data = String(url).includes('categories') ? { categories: ['science'] }
        : String(url).includes('trades') ? { marketId, items: [rawTrade] }
        : String(url).includes('?') ? { items: [rawMarket], nextCursor: null } : rawMarket;
      return new Response(JSON.stringify(data));
    });
    const result = await verifyPanta({ apiKey: key, accessConfirmed: true, fetchImpl, now: () => NOW });
    expect(result.status).toBe('passed');
    expect(result.readAccessEnabled).toBe(true);
    expect(result.freeQuotaVerified).toBe(false);
    expect(result.checks.map(check => check.resource)).toEqual(['categories', 'catalogue', 'detail', 'trades']);
    expect(result.checks.every(check => check.fetchedAt === NOW)).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(4);
    expect(JSON.stringify(result)).not.toContain(key);
  });
  it('keeps an empty catalogue partial instead of inventing a market', async () => {
    const result = await verifyPanta({ apiKey: key, accessConfirmed: true, now: () => NOW,
      fetchImpl: async url => new Response(JSON.stringify(String(url).includes('categories') ? { categories: ['science'] } : { items: [], nextCursor: null })) });
    expect(result.status).toBe('partial'); expect(result.checks).toHaveLength(2);
  });
  it('does not retain raw upstream bodies when verification fails', async () => {
    const result = await verifyPanta({ apiKey: key, accessConfirmed: true, now: () => NOW, fetchImpl: async () => new Response(key, { status: 401 }) });
    expect(result.status).toBe('failed'); expect(JSON.stringify(result)).not.toContain(key);
  });
});
