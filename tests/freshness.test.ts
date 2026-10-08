import { describe, expect, it } from 'vitest';
import { readIsStale } from '../src/features/markets/freshness';
import { NOW } from './fixtures/panta';

describe('source freshness at the observation clock', () => {
  it('ages successful reads without a new response and preserves failure staleness', () => {
    expect(readIsStale({ fetchedAt: NOW, stale: false }, NOW + 60000)).toBe(false);
    expect(readIsStale({ fetchedAt: NOW, stale: false }, NOW + 60001)).toBe(true);
    expect(readIsStale({ fetchedAt: NOW, stale: true }, NOW)).toBe(true);
  });
  it('rejects invalid timestamps and implausibly future source times', () => {
    expect(readIsStale({ fetchedAt: NaN, stale: false }, NOW)).toBe(true);
    expect(readIsStale({ fetchedAt: NOW + 5001, stale: false }, NOW)).toBe(true);
    expect(readIsStale({ fetchedAt: NOW + 5000, stale: false }, NOW)).toBe(false);
  });
});
