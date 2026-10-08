import type { Snapshot, AlertState, AlertEvaluation } from './model';
import { ExactDecimal, normalizePrice, percentagePointDelta } from '../markets/prices';
import { MAX_GAP_MS } from './history';
export function findChangeBaseline(history: Snapshot[], latest: Snapshot): Snapshot | null {
  if (latest.phase === 'unknown' || normalizePrice(latest.yesPrice) === null) return null;
  const samples = history.filter(s => s.marketId === latest.marketId && s.mode === latest.mode && s.observedAt <= latest.observedAt)
    .sort((a, b) => b.observedAt - a.observedAt);
  let next = latest;
  for (const sample of samples) {
    const age = latest.observedAt - sample.observedAt;
    if (age > 15 * 60000 || sample.phase !== latest.phase || normalizePrice(sample.yesPrice) === null || next.observedAt - sample.observedAt > MAX_GAP_MS) return null;
    if (age >= 10 * 60000) return sample;
    next = sample;
  }
  return null;
}
export function evaluateAlert(state: AlertState, history: Snapshot[], threshold: number, now: number): AlertEvaluation {
  const unavailable = (status: AlertEvaluation['status']): AlertEvaluation => ({
    state: { ...state, crossing: false }, status, deltaPp: null, triggered: false, direction: null, baselineAt: null,
  });
  const latest = [...history].sort((a, b) => b.observedAt - a.observedAt)[0];
  if (!Number.isFinite(threshold) || threshold < 1 || threshold > 20 || !latest || latest.phase === 'unknown'
    || normalizePrice(latest.yesPrice) === null || latest.observedAt > now + 5000) return unavailable('unavailable');
  if (now - latest.observedAt > 60000) return unavailable('stale');
  const baseline = findChangeBaseline(history, latest);
  if (!baseline) return unavailable('warming-up');
  const deltaPp = percentagePointDelta(baseline.yesPrice!, latest.yesPrice!);
  const delta = new ExactDecimal(deltaPp);
  const crossing = delta.abs().gte(threshold);
  const triggered = crossing && !state.crossing;
  return { status: 'ready', deltaPp, triggered, direction: delta.gt(0) ? 'up' : delta.lt(0) ? 'down' : null,
    baselineAt: baseline.observedAt, state: { crossing, lastEmittedAt: triggered ? latest.observedAt : state.lastEmittedAt } };
}
