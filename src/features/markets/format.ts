import { ExactDecimal, normalizePrice } from './prices';
import type { Market } from './model';
export function quoteLabel(price: string | null): string {
  const quote = normalizePrice(price);
  return quote === null ? '—' : `${new ExactDecimal(quote).times(100).toFixed(1).replace(/\.0$/, '')}%`;
}
export function amountLabel(value: string | null): string {
  if (value === null) return 'Unavailable';
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(number) : value;
}
export function dateLabel(time: number | null, withTime = false): string {
  if (time === null || !Number.isFinite(time) || Math.abs(time) > 8640000000000000) return 'Not provided';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' } as const : {}) }).format(time);
}
export function shortId(id: string): string { return id.length > 20 ? `${id.slice(0, 6)}…${id.slice(-6)}` : id; }
export function marketTitleLabel(market: Pick<Market, 'marketId' | 'title'>): string {
  return market.title.trim() ? market.title : `Untitled market · ${shortId(market.marketId)}`;
}
