import { describe, expect, it } from 'vitest';
import { evaluateAlert, findChangeBaseline } from '../src/features/observations/alerts';
import { makeSnapshot, NOW } from './fixtures/panta';
import type { AlertState } from '../src/features/observations/model';

const initial: AlertState = { crossing: false, lastEmittedAt: null };
const history = (latest = '0.45') => Array.from({ length: 21 }, (_, i) => makeSnapshot({ observedAt: NOW - (20 - i) * 30000, yesPrice: i === 20 ? latest : '0.40' }));
describe('change alerts', () => {
  it('triggers at exactly five percentage points but not just below', () => {
    expect(evaluateAlert(initial, history(), 5, NOW)).toMatchObject({ triggered: true, deltaPp: '5', direction: 'up', status: 'ready' });
    expect(evaluateAlert(initial, history('0.449999999'), 5, NOW).triggered).toBe(false);
    expect(evaluateAlert(initial, history('0.35'), 5, NOW).direction).toBe('down');
  });
  it('requires at least ten minutes of observed history', () => {
    expect(evaluateAlert(initial, history().slice(1), 5, NOW)).toMatchObject({ status: 'warming-up', triggered: false, deltaPp: null });
  });
  it('rejects a baseline older than fifteen minutes', () => {
    const samples = [makeSnapshot({ observedAt: NOW - 16 * 60000, yesPrice: '0.4' }), makeSnapshot()];
    expect(findChangeBaseline(samples, samples[1])).toBeNull();
  });
  it('selects the closest eligible baseline independently of input order', () => {
    const samples = history();
    samples.unshift(makeSnapshot({ observedAt: NOW - 12 * 60000, yesPrice: '0.2' }));
    expect(findChangeBaseline(samples.reverse(), makeSnapshot())?.observedAt).toBe(NOW - 600000);
  });
  it('never compares across an intervening phase change or quote gap', () => {
    const samples = history();
    samples[8] = makeSnapshot({ observedAt: samples[8].observedAt, phase: 'primary' });
    expect(evaluateAlert(initial, samples, 5, NOW).triggered).toBe(false);
    samples[8] = makeSnapshot({ observedAt: samples[8].observedAt, yesPrice: null });
    expect(evaluateAlert(initial, samples, 5, NOW).triggered).toBe(false);
  });
  it('does not treat null, unknown-phase or stale data as a signal', () => {
    const samples = history();
    samples[20] = makeSnapshot({ yesPrice: null });
    expect(evaluateAlert(initial, samples, 5, NOW).status).toBe('unavailable');
    samples[20] = makeSnapshot({ phase: 'unknown' });
    expect(evaluateAlert(initial, samples, 5, NOW).status).toBe('unavailable');
    expect(evaluateAlert(initial, history(), 5, NOW + 60001).status).toBe('stale');
    expect(evaluateAlert(initial, history(), 5, NOW + 60000).status).toBe('ready');
  });
  it('does not invent continuity after the browser missed observations', () => {
    const samples = history().filter((_, i) => i < 3 || i > 15);
    expect(evaluateAlert(initial, samples, 5, NOW).triggered).toBe(false);
  });
  it('emits once while crossed, and emits again only after reset', () => {
    const first = evaluateAlert(initial, history(), 5, NOW);
    const same = evaluateAlert(first.state, history(), 5, NOW);
    expect(same.triggered).toBe(false);
    const reset = evaluateAlert(same.state, history('0.41'), 5, NOW);
    expect(reset.state.crossing).toBe(false);
    expect(evaluateAlert(reset.state, history(), 5, NOW).triggered).toBe(true);
  });
  it('does not trigger with an invalid threshold or future timestamp', () => {
    expect(evaluateAlert(initial, history(), 0, NOW).status).toBe('unavailable');
    expect(evaluateAlert(initial, history(), 21, NOW).triggered).toBe(false);
    expect(evaluateAlert(initial, history(), 5, NOW - 60000).triggered).toBe(false);
  });
});
