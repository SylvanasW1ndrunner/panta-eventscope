import Decimal from 'decimal.js';

// Local precision avoids altering another library's global Decimal settings.
export const ExactDecimal = Decimal.clone({ precision: 160 });

export function normalizeAmount(raw: unknown): string | null {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  const value = String(raw).trim();
  if (value.length > 128 || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d{1,3})?$/i.test(value)) return null;
  try {
    const decimal = new ExactDecimal(value);
    return decimal.isFinite() && !decimal.isNegative() ? decimal.toFixed() : null;
  } catch { return null; }
}

export function normalizePrice(raw: unknown): string | null {
  const value = normalizeAmount(raw);
  return value !== null && new ExactDecimal(value).lte(1) ? value : null;
}

export function percentagePointDelta(before: string, after: string): string {
  if (normalizePrice(before) === null || normalizePrice(after) === null) throw new Error('Invalid quote');
  return new ExactDecimal(after).minus(before).times(100).toFixed();
}
