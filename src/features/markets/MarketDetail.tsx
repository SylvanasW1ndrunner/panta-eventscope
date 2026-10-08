import type { Market, CatalogPage, ReadResult, DataMode, Snapshot } from './model';
import type { ReadState } from '../workspace/useMarketData';
import { dateLabel, quoteLabel, amountLabel, shortId, marketTitleLabel } from './format';
import { HistoryChart } from '../observations/HistoryChart';
import { readIsStale } from './freshness';
export function MarketDetail({ catalogMarket, catalogRead, read, mode, history, watched, full, now, toggleWatch, refresh }: {
  catalogMarket?: Market; catalogRead?: ReadResult<CatalogPage>; read?: ReadState<Market>; mode: DataMode; history: Snapshot[]; watched: boolean; full: boolean;
  now: number; toggleWatch: () => void; refresh: () => void;
}) {
  const result = read?.result?.mode === mode ? read.result : undefined;
  const market = result?.data ?? catalogMarket;
  if (!market) return <section className="panel research-empty" aria-label="Market research"><span className="scope-symbol" aria-hidden="true">◎</span><h2>Choose an event to research</h2><p>Read its current quotes, start an observation window, then keep the evidence.</p></section>;
  const age = result ? Math.max(0, now - result.fetchedAt) : 0;
  const stale = result?.stale || age > 60000;
  const catalogue = catalogRead?.mode === mode ? catalogRead : undefined;
  const catalogueRow = catalogue?.data.items.find(row => row.marketId === market.marketId);
  return <section className="panel research" aria-label="Market research">
    <div className="detail-kicker"><span>{market.category} / {market.region || 'Region not provided'}</span><span className={`phase phase-${market.phase}`}>{market.phase === 'unknown' ? `Unknown phase: ${market.sourcePhase}` : market.phase}</span></div>
    <h2>{marketTitleLabel(market)}</h2><p className="market-description">{market.description || 'A description was not provided for this market.'}</p>
    <div className="detail-actions"><button className={watched ? 'secondary' : 'primary'} onClick={toggleWatch} disabled={full && !watched}>{watched ? 'Remove from watchlist' : 'Add to watchlist'}</button><button className="text-button" onClick={refresh} disabled={read?.loading}>↻ {read?.loading ? 'Reading…' : 'Refresh reads'}</button><span className="micro muted">{shortId(market.marketId)}</span></div>
    {read?.error && <div role="alert" className="error-box">{read.error.message}{result && <p>Keeping the previous read and its original timestamp.</p>}</div>}
    {result?.warnings.length && result.stale ? <div className="error-box">{result.warnings.join(' ')}</div> : null}
    <div className="quote-pair"><div className="quote yes"><span className="quote-label">YES quote</span><strong>{result ? quoteLabel(market.yesPrice) : '—'}</strong><div className="quote-bar"><span style={{ width: result && market.yesPrice !== null ? `${Number(market.yesPrice) * 100}%` : '0%' }} /></div><span className="micro">{result && market.yesPrice !== null ? `${market.yesPrice} USDC / share` : 'Price unavailable'}</span></div>
      <div className="quote no"><span className="quote-label">NO quote</span><strong>{result ? quoteLabel(market.noPrice) : '—'}</strong><div className="quote-bar"><span style={{ width: result && market.noPrice !== null ? `${Number(market.noPrice) * 100}%` : '0%' }} /></div><span className="micro">{result && market.noPrice !== null ? `${market.noPrice} USDC / share` : 'Price unavailable'}</span></div></div>
    <div className="read-stamp"><span className={`status-dot ${stale ? 'stale' : ''}`} aria-hidden="true" /><span>{!result ? 'Waiting for detail quotes' : stale ? 'Previous read · stale' : mode === 'demo' ? 'Example feed' : age > 0 ? 'Live source · cached read' : 'Live source'}</span><span>{result ? `API read ${dateLabel(result.fetchedAt, true)} UTC · ${Math.floor(age / 1000)}s ago` : 'Reading market details…'}</span></div>
    <p className="micro muted price-context">Quotes imply market odds. They are not a model forecast. API read time is not the last trade time.</p>
    <div className="market-facts"><div><span>Catalogue volume</span><strong>{amountLabel(catalogueRow?.volumeUsdc ?? null)} <small>USDC</small></strong>{catalogue && catalogueRow && <p className="micro muted">Oldest page: {dateLabel(catalogue.fetchedAt, true)} UTC{readIsStale(catalogue, now) ? ' · stale' : ''}</p>}</div><div><span>Market ends</span><strong>{dateLabel(market.endTime)}</strong></div><div><span>Scheduled resolution</span><strong>{dateLabel(market.resolutionTime)}</strong></div></div>
    <HistoryChart history={history} mode={mode} />
  </section>;
}
