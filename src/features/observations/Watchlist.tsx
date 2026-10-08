import type { SavedWorkspace } from './model';
import type { Market } from '../markets/model';
import type { ReadState } from '../workspace/useMarketData';
import { quoteLabel, shortId } from '../markets/format';
import { evaluateAlert } from './alerts';
export function Watchlist({ workspace, details, now, open, toggleCompare, toggleWatch, setThreshold, clearHistory }: {
  workspace: SavedWorkspace; details: Record<string, ReadState<Market>>; now: number;
  open: (id: string) => void; toggleCompare: (id: string) => void; toggleWatch: (id: string) => void;
  setThreshold: (value: number) => void; clearHistory: () => void;
}) {
  return <aside className="panel watch-panel" aria-label="Watchlist"><div className="panel-heading"><h2>Watchlist</h2><span className="count">{workspace.watchlist.length} / 4</span></div>
    <p className="micro muted">Every 30 seconds while this workspace is open.</p>
    {!workspace.watchlist.length && <div className="watch-empty"><span aria-hidden="true">◉</span><strong>Start an observation window</strong><p>Add an event to follow its quotes and collect your own evidence.</p></div>}
    <div className="watched-markets">{workspace.watchlist.map(id => {
      const read = details[id]; const market = read?.result?.data;
      const movement = evaluateAlert({ crossing: false, lastEmittedAt: null }, workspace.histories[id] ?? [], workspace.thresholdPp, now);
      const title = market?.title ?? shortId(id);
      return <div className="watched-market" key={id}><div className="watched-top"><button className="watch-open" onClick={() => open(id)}>{title}</button><button className="icon-button" onClick={() => toggleWatch(id)} aria-label={`Remove ${title} from watchlist`}>×</button></div><div className="watched-quote"><strong>{quoteLabel(market?.yesPrice ?? null)}</strong><span className="micro muted">{read?.result?.stale || read?.error ? 'Previous read' : movement.status === 'ready' ? `${Number(movement.deltaPp) > 0 ? '+' : ''}${movement.deltaPp} pp · 10m baseline` : movement.status === 'stale' ? 'Stale observation' : 'Collecting 10m baseline'}</span></div>
        <label className="compare-check"><input type="checkbox" checked={workspace.compare.includes(id)} onChange={() => toggleCompare(id)} disabled={!workspace.compare.includes(id) && workspace.compare.length >= 3} aria-label={`Compare ${title}`} />Compare event</label></div>;
    })}</div>
    <div className="alert-settings"><h3>Change alerts</h3><label className="threshold-field">Movement threshold<input type="number" min="1" max="20" step="1" value={workspace.thresholdPp} onChange={e => setThreshold(Number(e.target.value))} aria-label="Alert threshold in percentage points" /><span>pp</span></label><p className="micro muted">Compare with a valid quote 10–15 minutes earlier. Missing quotes, stale data or observation gaps pause the signal.</p></div>
    <div className="storage-summary"><span className="micro muted">Up to 500 samples / event · retained 7 days.</span><button className="text-button" onClick={clearHistory}>Clear observation history</button></div>
  </aside>;
}
