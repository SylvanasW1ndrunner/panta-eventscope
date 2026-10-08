import type { Trade, DataMode } from './model';
import type { ReadState } from '../workspace/useMarketData';
import { amountLabel, dateLabel, shortId } from './format';
export function TradeTape({ read, mode }: { read: ReadState<Trade[]>; mode: DataMode }) {
  const result = read.result?.mode === mode ? read.result : undefined;
  return <section className="panel trade-panel" aria-label="Trade evidence"><div className="section-heading"><div><h3>Trade evidence</h3><p>Recent records returned by the Panta catalogue</p></div><span className="mini-badge">{result?.data.length ?? 0} returned</span></div>
    {read.loading && !result && <p role="status" className="empty-state">Reading the trade tape…</p>}
    {read.error && <div className="error-box" role="alert">{read.error.message}</div>}
    {result && result.data.length === 0 && <p className="empty-state">No trade records were returned. This does not prove there were no trades.</p>}
    {result && result.data.length > 0 && <div className="table-scroll"><table><thead><tr><th scope="col">Time (UTC)</th><th scope="col">Phase</th><th scope="col">YES / NO shares</th><th scope="col">Evidence</th></tr></thead><tbody>{result.data.slice(0, 8).map((trade, i) => <tr key={`${trade.id}-${i}`}><td>{trade.blockTime === null ? 'Not provided' : dateLabel(trade.blockTime, true)}</td><td>{trade.isPrimary ? 'Primary' : 'Secondary'}</td><td>{amountLabel(trade.yesAmount)} / {amountLabel(trade.noAmount)}</td><td>{mode === 'demo' ? <span className="muted">Example record</span> : <span title={trade.signature}>{shortId(trade.signature)}</span>}</td></tr>)}</tbody></table></div>}
    <p className="micro muted">{result ? `Tape read ${dateLabel(result.fetchedAt, true)} UTC${result.stale ? ' · stale' : ''}. ` : ''}This bounded tape is not full chain history and does not reconstruct past prices. Amounts are shares, not trade notional.</p>
  </section>;
}
