import type { CatalogPage, Market, MarketQuery } from './model';
import type { ReadState } from '../workspace/useMarketData';
import { amountLabel } from './format';

export function MarketList({ catalog, categories, query, search, activeId, onQuery, onSearch, onSelect, loadMore, loadingMore, retry }: {
  catalog: ReadState<CatalogPage>; categories: string[]; query: MarketQuery; search: string; activeId: string;
  onQuery: (query: MarketQuery) => void; onSearch: (value: string) => void; onSelect: (market: Market) => void;
  loadMore: () => void; loadingMore: boolean; retry: () => void;
}) {
  const markets = catalog.result?.data.items ?? [];
  const filtered = markets.filter(m => `${m.title} ${m.description}`.toLowerCase().includes(search.toLowerCase()));
  return <aside className="discover panel" aria-label="Market discovery">
    <div className="panel-heading"><h2>Discover markets</h2><span className="count">{markets.length}</span></div>
    <label className="search-field"><span className="sr-only">Search loaded markets</span><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></svg><input value={search} onChange={e => onSearch(e.target.value)} placeholder="Search loaded markets" /></label>
    <div className="filters"><label>Category<select value={query.category ?? ''} onChange={e => onQuery({ ...query, category: e.target.value || undefined })}><option value="">All categories</option>{categories.map(category => <option key={category} value={category}>{category[0].toUpperCase() + category.slice(1)}</option>)}</select></label>
      <label>Market phase<select value={query.status ?? ''} onChange={e => onQuery({ ...query, status: (e.target.value || undefined) as MarketQuery['status'] })}><option value="">All phases</option><option value="primary">Primary</option><option value="secondary">Secondary</option><option value="resolved">Resolved</option><option value="cancelled">Cancelled</option></select></label></div>
    <p className="coverage">Search covers {markets.length} loaded market{markets.length === 1 ? '' : 's'}{catalog.result?.data.nextCursor ? '; more pages available' : ''}.</p>
    {catalog.loading && <div className="empty-state" role="status"><span className="loader" />Reading the market catalogue…</div>}
    {catalog.error && <div className="error-box" role="alert"><strong>{catalog.error.message}</strong><button className="text-button" onClick={retry}>Retry catalogue</button></div>}
    {!catalog.loading && !catalog.error && !markets.length && <div className="empty-state">No markets in this selection<p>Try another category or phase.</p></div>}
    {!catalog.loading && markets.length > 0 && !filtered.length && <div className="empty-state">No loaded markets match your search<p>Change the search or load another page.</p></div>}
    <div className="market-list">{filtered.map(market => <button key={market.marketId} className={`market-row ${market.marketId === activeId ? 'selected' : ''}`} onClick={() => onSelect(market)} aria-label={`Open market: ${market.title}`} aria-current={market.marketId === activeId ? 'true' : undefined}>
      <span className="row-kicker"><span>{market.category}</span><span className={`phase phase-${market.phase}`}>{market.phase}</span></span><strong>{market.title}</strong><span className="row-footer"><span>{amountLabel(market.volumeUsdc)} USDC <span className="muted">volume</span></span><span aria-hidden="true">↗</span></span>
    </button>)}</div>
    {catalog.result?.data.nextCursor && <button className="secondary full" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Reading next page…' : 'Load more markets'}</button>}
    <p className="micro muted catalogue-note">Catalogue quotes are unavailable. Open an event to read its spot quotes.</p>
  </aside>;
}
