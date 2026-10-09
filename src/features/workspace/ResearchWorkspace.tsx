'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DataMode, Market, MarketQuery, CatalogPage } from '../markets/model';
import { useMarketData, type ReadState } from './useMarketData';
import { useWorkspace } from './useWorkspace';
import { MarketList } from '../markets/MarketList';
import { MarketDetail } from '../markets/MarketDetail';
import { TradeTape } from '../markets/TradeTape';
import { Watchlist } from '../observations/Watchlist';
import { Comparison } from '../observations/Comparison';
import { dateLabel } from '../markets/format';
import { BriefPanel } from '../briefs/BriefPanel';

export function ResearchWorkspace({ initialMode }: { initialMode: DataMode }) {
  const [mode, setMode] = useState(initialMode);
  const [query, setQuery] = useState<MarketQuery>({});
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState('');
  const [selected, setSelected] = useState<Market | undefined>();
  const [mobileView, setMobileView] = useState<'discover' | 'research' | 'watchlist'>('discover');
  const [now, setNow] = useState<number>(0);
  const help = useRef<HTMLDialogElement>(null);
  const ws = useWorkspace(mode);
  const data = useMarketData({ mode, query, activeId, watchedIds: ws.workspace.watchlist });
  const catalog: ReadState<CatalogPage> = useMemo(() => data.catalog.requestKey === `${mode}:${JSON.stringify(query)}` ? data.catalog : { loading: true }, [data.catalog, mode, query]);
  useEffect(() => { setNow(Date.now()); const tick = setInterval(() => setNow(Date.now()), 5000); return () => clearInterval(tick); }, []);
  useEffect(() => {
    if (!activeId && !catalog.loading && catalog.result?.data.items.length) { setActiveId(catalog.result.data.items[0].marketId); setSelected(catalog.result.data.items[0]); }
  }, [catalog.result, activeId]);
  useEffect(() => { for (const read of Object.values(data.details)) if (read.result) ws.record(read.result); }, [data.details, ws.record]);
  const select = (market: Market) => { setActiveId(market.marketId); setSelected(market); setMobileView('research'); };
  const changeMode = (next: DataMode) => {
    if (next === mode) return;
    setMode(next); setActiveId(''); setSelected(undefined); setQuery({}); setSearch(''); setMobileView('discover');
    window.history.replaceState(null, '', `/?mode=${next}`);
  };
  const openWatched = (id: string) => { setActiveId(id); setSelected(data.details[id]?.result?.data); setMobileView('research'); };
  const changeQuery = (next: MarketQuery) => { setQuery(next); setActiveId(''); setSelected(undefined); };
  return <div className="app-shell">
    <a className="skip-link" href="#workspace">Skip to research workspace</a>
    <header className="site-header"><a className="brand" href="/"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="9" /><circle cx="15" cy="15" r="3" /><path d="M15 1v6m0 16v6M1 15h6m16 0h6" /></svg></span><strong>EventScope</strong><span className="brand-caption">EVENT RESEARCH</span></a><nav aria-label="Workspace navigation"><span className="nav-current">Workspace</span><button className="text-button" onClick={() => help.current?.showModal()}>What the data means</button><a href="https://docs.panta.market/llms.txt" target="_blank" rel="noreferrer">API reference ↗</a></nav><a className="panta-attribution" href="https://panta.market" target="_blank" rel="noreferrer"><span className="micro">Powered by</span><strong>Panta <span aria-hidden="true">↗</span></strong></a></header>
    <main id="workspace"><div className="workspace-heading"><div><span className="eyebrow">A RESEARCH DESK FOR PREDICTION MARKETS</span><h1>Follow the event. Keep the evidence.</h1><p>Read current quotes, observe what changes, and make your research reproducible.</p></div><div className="source-control" role="group" aria-label="Data source"><button aria-pressed={mode === 'live'} onClick={() => changeMode('live')}>Live Panta</button><button aria-pressed={mode === 'demo'} onClick={() => changeMode('demo')}>Example data</button></div></div>
    {mode === 'demo' && <div className="demo-banner" data-testid="demo-banner"><span aria-hidden="true">◈</span><strong>Example workspace</strong><span>Fictional markets and sample trades. No real event or on-chain evidence is represented.</span></div>}
    {mode === 'live' && catalog.error?.code === 'NOT_CONFIGURED' && <div className="setup-banner"><strong>Connect your Panta developer access</strong><span>Add your developer key on the local server and enable live reads. Example data is available above.</span><a href="/setup">Setup instructions ↗</a></div>}
    {data.retryAt > now && <div className="notice" role="status">Reads paused until {dateLabel(data.retryAt, true)} UTC. No automatic retry is made before this deadline.</div>}
    {ws.notice && <div className="notice" role="status"><span>{ws.notice}</span><button className="icon-button" onClick={ws.dismissNotice} aria-label="Dismiss notice">×</button></div>}
    {(ws.notifications.items.length > 0 || ws.notifications.overflow > 0) && <section aria-label="Quote movement alerts">{ws.notifications.items.map(item => <div className="change-notice" role="alert" key={item.id}><div><strong>{item.title}</strong><p>{item.direction === 'up' ? 'Rose' : 'Fell'} {item.deltaPp} pp across the observed interval · {dateLabel(item.observedAt, true)} UTC.</p></div><button className="secondary" aria-label={`Open alerted market: ${item.title}`} onClick={() => openWatched(item.marketId)}>View event</button><button className="icon-button" aria-label={`Dismiss alert for ${item.title}`} onClick={() => ws.dismissAlert(item.id)}>×</button></div>)}{ws.notifications.overflow > 0 && <div className="notice" role="status"><span>{ws.notifications.overflow} additional quote changes occurred while the 16-notification queue was full. Review your watched events.</span><button className="text-button" onClick={ws.dismissOverflow}>Dismiss extra-change notice</button></div>}</section>}
    <div className="mobile-tabs" role="group" aria-label="Workspace panels"><button aria-pressed={mobileView === 'discover'} onClick={() => setMobileView('discover')}>Discover</button><button aria-pressed={mobileView === 'research'} onClick={() => setMobileView('research')}>Research</button><button aria-pressed={mobileView === 'watchlist'} onClick={() => setMobileView('watchlist')}>Watchlist</button></div>
    <div className={`workspace-grid view-${mobileView}`}><MarketList catalog={catalog} categories={data.categories.result?.mode === mode ? data.categories : { loading: data.categories.loading, error: data.categories.error }} query={query} search={search} activeId={activeId} onQuery={changeQuery} onSearch={setSearch} onSelect={select} loadMore={data.loadMore} loadingMore={data.loadingMore} retry={data.refresh} now={now || Date.now()} />
      <div className="research-column"><MarketDetail catalogMarket={selected} catalogRead={catalog.result} read={data.details[activeId]} mode={mode} history={ws.workspace.histories[activeId] ?? []} watched={ws.workspace.watchlist.includes(activeId)} full={ws.workspace.watchlist.length >= 4} now={now || Date.now()} toggleWatch={() => ws.toggleWatch(activeId)} refresh={data.refresh} />
        <Comparison workspace={ws.workspace} details={data.details} now={now || Date.now()} />{activeId && <><BriefPanel key={`${mode}:${activeId}`} read={data.details[activeId]?.result?.mode === mode ? data.details[activeId].result : undefined} history={ws.workspace.histories[activeId] ?? []} trades={data.trades.result?.mode === mode ? data.trades.result : undefined} /><TradeTape read={data.trades} mode={mode} now={now || Date.now()} /></>}
      </div><Watchlist workspace={ws.workspace} details={data.details} now={now || Date.now()} open={openWatched} toggleCompare={ws.toggleCompare} toggleWatch={ws.toggleWatch} setThreshold={ws.setThreshold} clearHistory={ws.clearHistory} /></div>
    <footer className="app-footer"><span>Independent EventScope workspace · read-only research</span><span>All timestamps UTC · monitoring stops when the browser closes.</span><button className="text-button" onClick={() => help.current?.showModal()}>Data & limitations</button></footer></main>
    <dialog ref={help} className="help-dialog" aria-labelledby="help-title"><div className="panel-heading"><h2 id="help-title">Understand your evidence</h2><button className="icon-button" onClick={() => help.current?.close()} aria-label="Close data explanation">×</button></div><p>EventScope is an independent research tool. Panta supplies the market catalogue, categories, detail quotes and recent trade records.</p><dl><dt>Quotes and volume</dt><dd>YES and NO are spot quotes from market details when available. Catalogue volume is not 24-hour volume. Missing values are never replaced with zero.</dd><dt>Observation time</dt><dd>Charts contain actual detail reads made by this tool. API read time is not Panta’s internal update time or the last on-chain trade time. One sample cannot establish a price history.</dd><dt>Change alerts</dt><dd>Default threshold: 5 percentage points against a quote 10–15 minutes earlier. Quotes must be in the same uninterrupted phase. Missing prices, stale reads and gaps above 90 seconds interrupt the window.</dd><dt>Trade evidence</dt><dd>A maximum of 50 recent trade records is requested. Share amounts and fees cannot reconstruct historical prices. Example records have no explorer links.</dd><dt>Local storage</dt><dd>History stays in this browser, separate for live and example modes, up to 500 samples per event and seven days. This tool collects and alerts only while open. You can clear observation history.</dd></dl><button className="primary" onClick={() => help.current?.close()}>Back to research</button></dialog>
  </div>;
}
