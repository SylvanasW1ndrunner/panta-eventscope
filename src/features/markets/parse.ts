import bs58 from 'bs58';
import type { Market, MarketPhase, CatalogPage, Trade } from './model';
import { normalizeAmount, normalizePrice } from './prices';

export const phases = ['primary', 'secondary', 'resolved', 'cancelled'] as const;
export function isValidMarketId(raw: unknown): raw is string {
  if (typeof raw !== 'string' || raw.length < 32 || raw.length > 44) return false;
  try { return bs58.decode(raw).length === 32; } catch { return false; }
}
export function record(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid response schema');
  return raw as Record<string, unknown>;
}
function text(raw: unknown, max = 20000): string {
  if (typeof raw !== 'string' || raw.length > max) throw new Error('Invalid text field');
  return raw;
}
function optionalText(raw: unknown, max?: number): string { return raw == null ? '' : text(raw, max); }
function unixTime(raw: unknown): number | null {
  return typeof raw === 'number' && Number.isSafeInteger(raw) && raw >= 0 && raw <= 8640000000000 ? raw * 1000 : null;
}
export function parseMarket(raw: unknown): Market {
  const row = record(raw);
  if (!isValidMarketId(row.marketId)) throw new Error('Invalid market address');
  const sourcePhase = text(row.phase, 100);
  const phase: MarketPhase = phases.includes(sourcePhase as typeof phases[number]) ? sourcePhase as MarketPhase : 'unknown';
  return {
    marketId: row.marketId, category: text(row.category, 100), title: text(row.title, 2000),
    description: optionalText(row.description), images: Array.isArray(row.images) ? row.images.filter((x): x is string => typeof x === 'string').slice(0, 20) : [],
    phase, sourcePhase, marketType: optionalText(row.marketType, 100), region: optionalText(row.region, 100),
    startTime: unixTime(row.startTime), endTime: unixTime(row.endTime), resolutionTime: unixTime(row.resolutionTime),
    resolved: row.resolved === true, status: optionalText(row.status, 100), volumeUsdc: normalizeAmount(row.volumeUsdc),
    campaignId: row.campaignId == null ? null : text(row.campaignId, 200), createdByPartner: row.createdByPartner === true,
    yesPrice: normalizePrice(row.yesPrice), noPrice: normalizePrice(row.noPrice),
    primaryYesPrice: normalizePrice(row.primaryYesPrice), primaryNoPrice: normalizePrice(row.primaryNoPrice),
    secondaryYesPrice: normalizePrice(row.secondaryYesPrice), secondaryNoPrice: normalizePrice(row.secondaryNoPrice),
  };
}
export function parseCatalog(raw: unknown): CatalogPage {
  const row = record(raw);
  if (!Array.isArray(row.items) || row.items.length > 50) throw new Error('Invalid catalogue rows');
  return {
    items: row.items.map(parseMarket),
    nextCursor: row.nextCursor == null ? null : text(row.nextCursor, 512),
  };
}
export function parseTrades(raw: unknown): Trade[] {
  const root = record(raw);
  if (!isValidMarketId(root.marketId) || !Array.isArray(root.items) || root.items.length > 200) throw new Error('Invalid trade response');
  return root.items.map((item): Trade => {
    const row = record(item);
    if (row.marketId !== root.marketId || typeof row.isPrimary !== 'boolean') throw new Error('Invalid trade record');
    if (typeof row.id !== 'string' && !(typeof row.id === 'number' && Number.isFinite(row.id))) throw new Error('Invalid trade identifier');
    return {
      id: String(row.id), marketId: String(row.marketId), wallet: text(row.wallet, 100), isPrimary: row.isPrimary,
      yesAmount: normalizeAmount(row.yesAmount), noAmount: normalizeAmount(row.noAmount), feePaid: normalizeAmount(row.feePaid),
      blockTime: unixTime(row.blockTime), signature: text(row.signature, 200), quoteAsset: text(row.quoteAsset, 100),
    };
  });
}
