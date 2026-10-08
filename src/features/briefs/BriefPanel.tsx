'use client';
import { useState } from 'react';
import type { Market, ReadResult, Snapshot, Trade } from '../markets/model';
import type { EvidenceBrief } from './model';
import { buildEvidenceBrief } from './build';
import { exportBriefJson, exportBriefMarkdown, exportBriefCsv } from './export';
import { quoteLabel, marketTitleLabel } from '../markets/format';

export function BriefPanel({ read, history, trades }: { read?: ReadResult<Market>; history: Snapshot[]; trades?: ReadResult<Trade[]> }) {
  const [brief, setBrief] = useState<EvidenceBrief | null>(null);
  const [error, setError] = useState<string | null>(null);
  const generate = () => {
    if (!read) return;
    try {
      const matchingTrades = trades?.mode === read.mode && trades.data.every(row => row.marketId === read.data.marketId) ? trades : undefined;
      setBrief(buildEvidenceBrief({ market: read.data, read, history, trades: matchingTrades, generatedAt: Date.now() })); setError(null);
    } catch { setError('This capture could not be completed. Refresh the selected market and try again.'); }
  };
  const download = (format: 'json' | 'md' | 'csv') => {
    if (!brief) return;
    const contents = format === 'json' ? exportBriefJson(brief) : format === 'md' ? exportBriefMarkdown(brief) : exportBriefCsv(brief);
    const blob = new Blob([contents], { type: format === 'json' ? 'application/json;charset=utf-8' : format === 'csv' ? 'text/csv;charset=utf-8' : 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `eventscope-${brief.mode}-${brief.market.marketId.slice(0, 6)}-${new Date(brief.generatedAt).toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
  };
  return <section className="panel brief-panel" aria-label="Evidence brief"><div className="section-heading"><div><h3>Evidence brief</h3><p>A fixed capture of your selected event and its observed window.</p></div><span className="brief-symbol" aria-hidden="true">↳</span></div>
    {!brief && <p className="brief-intro">Keep the quotes, read times, market conditions and transaction evidence together. Generate once, then download the same capture in the format you need.</p>}
    <button className={brief ? 'secondary' : 'primary'} onClick={generate} disabled={!read}>{brief ? 'Regenerate evidence brief' : 'Generate evidence brief'}</button>
    {error && <p role="alert" className="error-box">{error}</p>}
    {brief && <div className="brief-capture"><div className="brief-source"><strong>{brief.mode === 'demo' ? 'FICTIONAL EXAMPLE' : brief.stale ? 'STALE LIVE READ' : 'LIVE SOURCE CAPTURE'}</strong><span>{brief.evidence.length} tape records</span></div><h4>{marketTitleLabel(brief.market)}</h4><div className="brief-quotes"><div><span>YES</span><strong>{quoteLabel(brief.quotes.yes)}</strong></div><div><span>NO</span><strong>{quoteLabel(brief.quotes.no)}</strong></div><div><span>Observed change</span><strong>{brief.observation.deltaPp === null ? 'Not established' : `${Number(brief.observation.deltaPp) > 0 ? '+' : ''}${brief.observation.deltaPp} pp`}</strong></div></div>
      <p className="capture-time">Source read: {new Date(brief.observedAt).toISOString()}</p><p className="micro muted">{brief.observation.samples} actual samples in this {brief.mode === 'demo' ? 'example' : 'live-source'} capture. Read time is not a transaction timestamp.</p>
      <details><summary>Interpretation & limits</summary><ul>{brief.notes.map((note, i) => <li key={i}>{note}</li>)}</ul></details>
      {read && read.fetchedAt !== brief.observedAt && <p className="micro notice">New reads are available. This brief stays fixed until you regenerate it.</p>}
      <div className="export-buttons"><button className="secondary" onClick={() => download('md')}>Download Markdown</button><button className="secondary" onClick={() => download('json')}>Download JSON</button><button className="secondary" onClick={() => download('csv')}>Download CSV</button></div></div>}
  </section>;
}
