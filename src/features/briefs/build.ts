import type { BriefInput, EvidenceBrief } from './model';
import { appendSnapshot } from '../observations/history';
import { findChangeBaseline } from '../observations/alerts';
import { normalizePrice, percentagePointDelta } from '../markets/prices';
import { transactionUrl } from './evidence';

export function buildEvidenceBrief({ market, read, history, trades, generatedAt }: BriefInput): EvidenceBrief {
  if (market.marketId !== read.data.marketId || market.yesPrice !== read.data.yesPrice || market.noPrice !== read.data.noPrice) throw new Error('Detail data and captured market must match');
  if (trades && (trades.mode !== read.mode || trades.data.some(row => row.marketId !== market.marketId))) throw new Error('Trade market and source must match the captured detail');
  const stale = read.stale || generatedAt - read.fetchedAt > 60000 || read.fetchedAt > generatedAt + 5000;
  const latest = { marketId: market.marketId, mode: read.mode, phase: market.phase, observedAt: read.fetchedAt,
    yesPrice: normalizePrice(read.data.yesPrice), noPrice: normalizePrice(read.data.noPrice) };
  const samples = appendSnapshot(history.filter(s => s.marketId === market.marketId && s.mode === read.mode && s.observedAt < read.fetchedAt), latest, generatedAt);
  const baseline = !stale ? findChangeBaseline(samples, latest) : null;
  const deltaPp = baseline ? percentagePointDelta(baseline.yesPrice!, latest.yesPrice!) : null;
  const notes = [
    ...(read.mode === 'demo' ? ['FICTIONAL EXAMPLE: sample markets and trades. No actual event or on-chain evidence is represented.'] : []),
    ...(stale ? ['This detail read is stale or its time is unavailable for a fresh comparison. No movement is inferred.'] : []),
    ...(latest.yesPrice === null || latest.noPrice === null ? ['At least one quote is unavailable. Missing prices are not zero.'] : []),
    ...(deltaPp === null && !stale ? ['An uninterrupted 10–15 minute comparison window is not available.'] : []),
    ...(deltaPp !== null ? [`Observed YES movement: ${Number(deltaPp) > 0 ? '+' : ''}${deltaPp} percentage points from ${new Date(baseline!.observedAt).toISOString()} to ${new Date(read.fetchedAt).toISOString()}.`] : []),
    'API read time is not the last on-chain trade time or Panta’s internal update time.',
    'Catalogue volume is cumulative catalogue data; a 24-hour window is not specified.',
    trades ? `${trades.data.length} recent catalogue trade records were captured. This is a bounded tape, not full chain history.` : 'No trade tape was included in this capture.',
    'Share amounts and fees do not reconstruct historical prices or trade notional.',
    'This brief records observations. It does not explain why quotes moved or provide a model forecast.',
    ...read.warnings,
    ...(trades?.stale ? ['The captured trade tape is stale.'] : []),
  ];
  return {
    schemaVersion: 1, product: 'EventScope', mode: read.mode, generatedAt, observedAt: read.fetchedAt,
    market: { marketId: market.marketId, title: market.title, description: market.description, category: market.category,
      phase: market.phase === 'unknown' ? `Unknown: ${market.sourcePhase}` : market.phase, volumeUsdc: market.volumeUsdc,
      endTime: market.endTime, resolutionTime: market.resolutionTime },
    quotes: { yes: latest.yesPrice, no: latest.noPrice }, stale,
    observation: { startedAt: samples[0]?.observedAt ?? null, samples: samples.length, baselineAt: baseline?.observedAt ?? null, deltaPp },
    tradeReadAt: trades?.fetchedAt ?? null, tradeReadStale: trades?.stale ?? false,
    evidence: (trades?.data ?? []).map(row => ({ ...row, explorerUrl: transactionUrl(row.signature, read.mode) })),
    notes: [...new Set(notes)], sources: [
      { label: 'Panta market detail contract', url: 'https://docs.panta.market/api-reference/markets/get' },
      { label: 'Panta trade tape contract', url: 'https://docs.panta.market/api-reference/markets/trades' },
    ],
  };
}
