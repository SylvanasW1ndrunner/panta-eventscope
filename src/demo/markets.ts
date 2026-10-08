import bs58 from 'bs58';
import type { Market, MarketQuery, CatalogPage, ReadResult, Trade } from '../features/markets/model';
import { parseMarket } from '../features/markets/parse';
import { PantaError } from '../server/panta/errors';

// Independently written fictional examples, not real event addresses or transactions.
const examples = [
  ['science', 'Will the Aurora mission launch before December?', 'A fictional lunar mission for demonstrating event research. YES resolves if the imaginary Aurora mission launches before 1 December 2026; otherwise NO. This is sample data, not an actual prediction market.', '0.64', 'secondary', '42850.20'],
  ['crypto', 'Will SOL close above $250 on New Year’s Eve?', 'Fictional event for product demonstration. The example settlement condition is a specified year-end close. No real exchange price or market is represented.', '0.38', 'secondary', '113420.00'],
  ['science', 'Will the Atlas telescope publish its first image in 2026?', 'A fictional space observatory and a fictional resolution condition. Demonstrates the primary-phase research flow.', '0.72', 'primary', '19620.50'],
  ['sports', 'Will Northbridge win the winter championship?', 'Fictional teams in an imaginary tournament. Resolves on the published result of the sample final.', '0.51', 'primary', '8920.00'],
  ['finance', 'Will the reference rate fall below 3% this quarter?', 'Illustrative economic event. No actual central bank decision, price feed or deployed market is asserted.', null, 'secondary', '67410.00'],
  ['world', 'Will the fictional Harbor rail link open by October?', 'An imaginary infrastructure event that has resolved. Demonstrates an ended event without inventing historical observations.', '1', 'resolved', '34600.00'],
  ['science', 'Will the fictional Vega probe complete its flyby?', 'Cancelled sample event. Its original resolution condition is no longer active.', null, 'cancelled', '5100.00'],
] as const;
export const demoMarkets: Market[] = examples.map(([category, title, description, yesPrice, phase, volumeUsdc], i) => parseMarket({
  marketId: bs58.encode(new Uint8Array(32).fill(i + 170)), category, title, description,
  images: [], phase, marketType: 'standard', startTime: 1790899200, endTime: 1796083200 + i * 86400,
  resolutionTime: 1796169600 + i * 86400, region: 'Global', resolved: phase === 'resolved',
  status: phase === 'resolved' ? 'resolved' : phase === 'cancelled' ? 'cancelled' : 'open',
  volumeUsdc, campaignId: null, createdByPartner: false, yesPrice,
  noPrice: yesPrice === null ? null : String((100 - Math.round(Number(yesPrice) * 100)) / 100),
  primaryYesPrice: phase === 'primary' ? yesPrice : null, primaryNoPrice: null,
  secondaryYesPrice: phase === 'secondary' ? yesPrice : null, secondaryNoPrice: null,
}));
export function demoResult<T>(data: T, now = Date.now()): ReadResult<T> {
  return { data, mode: 'demo', fetchedAt: now, ageMs: 0, stale: false, warnings: ['Fictional examples. These are not live markets or on-chain evidence.'] };
}
export function demoCatalog(query: MarketQuery): CatalogPage {
  const all = demoMarkets.filter(m => (!query.category || m.category === query.category) && (!query.status || m.phase === query.status));
  const index = query.cursor ? all.findIndex(m => m.marketId === query.cursor) : -1;
  if (query.cursor && index < 0) throw new PantaError('INVALID_PARAMS');
  const items = all.slice(index + 1, index + 1 + (query.limit ?? 20));
  return { items: items.map(m => ({ ...m, yesPrice: null, noPrice: null, primaryYesPrice: null, primaryNoPrice: null, secondaryYesPrice: null, secondaryNoPrice: null })),
    nextCursor: index + 1 + items.length < all.length ? items.at(-1)!.marketId : null };
}
export function demoMarket(id: string): Market {
  const market = demoMarkets.find(m => m.marketId === id);
  if (!market) throw new PantaError('NOT_FOUND');
  return market;
}
export function demoTrades(id: string, limit: number): Trade[] {
  const market = demoMarket(id);
  if (market.phase === 'cancelled' || market.yesPrice === null) return [];
  return [0, 1, 2, 3].slice(0, limit).map(i => ({
    id: `example-${i}`, marketId: id, wallet: 'Fictional participant', isPrimary: market.phase === 'primary',
    yesAmount: ['24', '0', '62', '15'][i], noAmount: i === 1 ? '18' : '0', feePaid: '0.05',
    blockTime: Date.UTC(2026, 9, 8, 9, 55 - i), signature: `fictional-record-${i}`, quoteAsset: 'USDC',
  }));
}
