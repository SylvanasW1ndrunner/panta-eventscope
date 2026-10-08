import type { Snapshot } from './model';
import { historySegments } from './history';
import { quoteLabel, dateLabel } from '../markets/format';
export function HistoryChart({ history, mode }: { history: Snapshot[]; mode: 'live' | 'demo' }) {
  const samples = history.filter(s => s.mode === mode).sort((a, b) => a.observedAt - b.observedAt);
  const segments = historySegments(samples);
  const count = segments.reduce((sum, segment) => sum + segment.length, 0);
  const first = samples.at(0)?.observedAt;
  const last = samples.at(-1)?.observedAt;
  const x = (time: number) => first && last && last !== first ? 50 + ((time - first) / (last - first)) * 510 : 305;
  const y = (price: string) => 155 - Number(price) * 125;
  return <section className="observation-section" aria-label="Observed quote history">
    <div className="section-heading"><div><h3>Observed YES quotes</h3><p>{mode === 'demo' ? 'Samples read from the fictional example feed' : 'Quotes collected by this workspace'}</p></div><span className="mini-badge">{count} sample{count === 1 ? '' : 's'}</span></div>
    <figure className="history-figure"><svg viewBox="0 0 610 190" role="img" aria-label={count < 2 ? 'Not enough observations to show a price history' : 'YES quotes at actual observation times, with gaps left unconnected'}>
      {[30, 92.5, 155].map((height, i) => <g key={height}><line x1="50" x2="570" y1={height} y2={height} className="chart-grid" /><text x="5" y={height + 4}>{[100, 50, 0][i]}%</text></g>)}
      {segments.map((segment, i) => <g key={i}>{segment.length >= 2 && <polyline points={segment.map(s => `${x(s.observedAt)},${y(s.yesPrice!)}`).join(' ')} className="chart-line" />}{segment.map(s => <circle key={s.observedAt} cx={x(s.observedAt)} cy={y(s.yesPrice!)} r="4.5" className="chart-dot"><title>{dateLabel(s.observedAt, true)} UTC · {quoteLabel(s.yesPrice)}</title></circle>)}</g>)}
      {count === 0 && <text x="305" y="98" textAnchor="middle" className="chart-empty">Waiting for an available quote</text>}
      <text x="50" y="181">{first ? new Date(first).toISOString().slice(11, 19) : 'Observation time'}</text>{last && last !== first && <text x="570" y="181" textAnchor="end">{new Date(last).toISOString().slice(11, 19)}</text>}
    </svg><figcaption>{count === 1 ? 'One quote observed. More samples are needed before a history can be drawn.' : count === 0 ? 'Missing prices stay missing; no trend is inferred.' : 'Only actual samples are connected. Missing quotes, phase changes and gaps interrupt the line.'}</figcaption></figure>
    {first && <p className="micro muted">Observation started {dateLabel(first, true)} UTC · latest read {dateLabel(last!, true)} UTC.</p>}
  </section>;
}
