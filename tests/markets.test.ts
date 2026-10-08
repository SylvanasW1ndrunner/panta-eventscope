import { describe, expect, it } from 'vitest';
import { normalizePrice, percentagePointDelta } from '../src/features/markets/prices';
import { parseMarket, parseCatalog, parseTrades, isValidMarketId } from '../src/features/markets/parse';
import { marketId, rawMarket, rawTrade } from './fixtures/panta';

describe('quotes and price movements', () => {
  it.each([
    [null, null], [undefined, null], ['', null], ['NaN', null], [Infinity, null],
    ['-0.1', null], ['1.01', null], ['0', '0'], [0, '0'], ['1.00', '1'],
    ['0.4500', '0.45'], [0.52, '0.52'], ['1e-7', '0.0000001'],
    ['0x01', null], [{}, null], [' '.repeat(500), null],
  ])('normalizes %j without inventing a price', (input, want) => {
    expect(normalizePrice(input)).toBe(want);
  });
  it('computes exact percentage points at threshold boundaries', () => {
    expect(percentagePointDelta('0.40', '0.45')).toBe('5');
    expect(percentagePointDelta('0.45', '0.40')).toBe('-5');
    expect(percentagePointDelta('0.4', '0.449999999')).toBe('4.9999999');
    expect(percentagePointDelta('0', '1')).toBe('100');
  });
});

describe('Panta contract boundaries', () => {
  it('retains catalogue meanings and millisecond observation-compatible times', () => {
    const market = parseMarket(rawMarket);
    expect(market.marketId).toBe(marketId);
    expect(market.volumeUsdc).toBe('12500.5');
    expect(market.phase).toBe('secondary');
    expect(market.endTime).toBe(1795000000000);
    expect(market.secondaryYesPrice).toBe('0.45');
  });
  it('keeps missing prices and an unrecognised phase explicit', () => {
    const market = parseMarket({ ...rawMarket, phase: 'future-phase', yesPrice: null, noPrice: 'bad' });
    expect(market.phase).toBe('unknown');
    expect(market.sourcePhase).toBe('future-phase');
    expect(market.yesPrice).toBeNull();
    expect(market.noPrice).toBeNull();
  });
  it('accepts valid 32-byte addresses and rejects arbitrary paths', () => {
    expect(isValidMarketId(marketId)).toBe(true);
    expect(isValidMarketId('../account/keys')).toBe(false);
    expect(isValidMarketId('1234')).toBe(false);
    expect(() => parseMarket({ ...rawMarket, marketId: 'https://elsewhere.test' })).toThrow();
  });
  it.each([null, [], {}, { ...rawMarket, title: 9 }, { ...rawMarket, category: [] }])(
    'rejects an invalid market record', raw => expect(() => parseMarket(raw)).toThrow(),
  );
  it('parses pagination without deriving live list quotes', () => {
    const page = parseCatalog({ items: [{ ...rawMarket, yesPrice: null, noPrice: null }], nextCursor: 'opaque:cursor' });
    expect(page.items[0].yesPrice).toBeNull();
    expect(page.nextCursor).toBe('opaque:cursor');
    expect(parseCatalog({ items: [] }).nextCursor).toBeNull();
  });
  it.each([{}, { items: null }, { items: [{}] }, { items: [], nextCursor: 3 }])(
    'rejects invalid catalogue schemas', raw => expect(() => parseCatalog(raw)).toThrow(),
  );
  it('preserves shares, fees and missing block times without fabricating trade prices', () => {
    const trades = parseTrades({ marketId, items: [{ ...rawTrade, blockTime: null }] });
    expect(trades[0].yesAmount).toBe('10');
    expect(trades[0].feePaid).toBe('0.05');
    expect(trades[0].blockTime).toBeNull();
    expect(trades[0]).not.toHaveProperty('price');
  });
  it('rejects trade records for a different market', () => {
    expect(() => parseTrades({ marketId, items: [{ ...rawTrade, marketId: 'So11111111111111111111111111111111111111112' }] })).toThrow();
  });
  it('rejects a malformed trade envelope', () => {
    expect(() => parseTrades({ marketId, items: [{}] })).toThrow();
  });
});
