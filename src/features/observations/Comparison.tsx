import type { SavedWorkspace } from './model';
import type { Market } from '../markets/model';
import type { ReadState } from '../workspace/useMarketData';
import { quoteLabel, shortId, dateLabel } from '../markets/format';
import { readIsStale } from '../markets/freshness';
export function Comparison({ workspace, details, now }: { workspace: SavedWorkspace; details: Record<string, ReadState<Market>>; now: number }) {
  if (!workspace.compare.length) return null;
  return <section className="panel comparison-panel" aria-label="Market comparison"><div className="section-heading"><div><h3>Compare observed events</h3><p>Each event keeps its own read time and resolution condition.</p></div><span className="mini-badge">{workspace.compare.length} / 3</span></div><div className="comparison-grid">{workspace.compare.map(id => {
    const read = details[id]; const market = read?.result?.data;
    return <div key={id}><span className="micro muted">{market?.phase ?? 'Reading'}</span><h4>{market?.title ?? shortId(id)}</h4><strong>{quoteLabel(market?.yesPrice ?? null)}</strong><span className="micro">YES quote{read?.result && readIsStale(read.result, now) ? ' · stale' : ''}</span><p className="micro muted">{read?.result ? `${dateLabel(read.result.fetchedAt, true)} UTC` : 'Read pending'}</p></div>;
  })}</div><p className="micro muted">Quotes alone do not establish correlation or arbitrage between events.</p></section>;
}
