import { describe, expect, it } from 'vitest';
import bs58 from 'bs58';
import { buildEvidenceBrief } from '../src/features/briefs/build';
import { exportBriefJson, exportBriefMarkdown, exportBriefCsv } from '../src/features/briefs/export';
import { transactionUrl } from '../src/features/briefs/evidence';
import { parseMarket, parseTrades } from '../src/features/markets/parse';
import { makeSnapshot, rawMarket, rawTrade, marketId, secondId, NOW } from './fixtures/panta';
import type { BriefInput } from '../src/features/briefs/model';

const input = (patch: Partial<BriefInput> = {}): BriefInput => {
  const market = parseMarket(rawMarket);
  return { market, read: { data: market, mode: 'live', fetchedAt: NOW, ageMs: 0, stale: false, warnings: [] },
    history: Array.from({ length: 21 }, (_, i) => makeSnapshot({ observedAt: NOW - (20 - i) * 30000, yesPrice: i === 20 ? '0.45' : '0.4' })),
    trades: { data: parseTrades({ marketId, items: [rawTrade] }), mode: 'live', fetchedAt: NOW - 10000, ageMs: 10000, stale: false, warnings: [] },
    generatedAt: NOW, ...patch };
};
describe('captured evidence briefs', () => {
  it('marks an aged successful trade read stale at capture without aging the saved capture later', () => {
    const value = input(); value.trades!.fetchedAt = NOW - 600000; value.trades!.stale = false;
    const brief = buildEvidenceBrief(value);
    expect(brief.stale).toBe(false);
    expect(brief.tradeReadStale).toBe(true);
    expect(brief.notes).toContain('The captured trade tape is stale.');
    const captured = exportBriefJson(brief);
    value.trades!.fetchedAt = NOW;
    expect(exportBriefJson(brief)).toBe(captured);
  });
  it('captures quotes, actual read times and an exact observed change', () => {
    const brief = buildEvidenceBrief(input());
    expect(brief.quotes).toEqual({ yes: '0.45', no: '0.55' });
    expect(brief.observedAt).toBe(NOW);
    expect(brief.tradeReadAt).toBe(NOW - 10000);
    expect(brief.observation).toMatchObject({ samples: 21, baselineAt: NOW - 600000, deltaPp: '5' });
    expect(brief.notes.join(' ')).not.toMatch(/because|forecast predicts/i);
    expect(brief.market).not.toHaveProperty('volume24h');
  });
  it('keeps source mode and timestamps in every export', () => {
    const value = input(); value.read.mode = 'demo'; value.trades!.mode = 'demo'; value.history = value.history.map(s => ({ ...s, mode: 'demo' }));
    const brief = buildEvidenceBrief(value);
    const json = JSON.parse(exportBriefJson(brief));
    expect(json.mode).toBe('demo'); expect(json.observedAt).toBe(NOW);
    expect(exportBriefMarkdown(brief)).toContain('FICTIONAL EXAMPLE');
    expect(exportBriefCsv(brief)).toContain('demo');
    expect(brief.evidence[0].explorerUrl).toBeNull();
  });
  it('does not compute a movement from stale data or one sample', () => {
    const value = input(); value.read.stale = true;
    expect(buildEvidenceBrief(value).observation.deltaPp).toBeNull();
    expect(buildEvidenceBrief(input({ history: [makeSnapshot()] })).observation.baselineAt).toBeNull();
    expect(buildEvidenceBrief(input({ generatedAt: NOW + 61000 })).stale).toBe(true);
  });
  it('preserves missing quotes and catalogue volume meaning', () => {
    const value = input(); value.market = { ...value.market, yesPrice: null, noPrice: null }; value.read.data = value.market;
    const brief = buildEvidenceBrief(value);
    expect(brief.quotes.yes).toBeNull(); expect(brief.observation.deltaPp).toBeNull();
    expect(exportBriefMarkdown(brief)).toContain('Catalogue volume');
    expect(exportBriefMarkdown(brief)).toContain('unavailable');
  });
  it('refuses mismatched detail records instead of mixing refresh states', () => {
    const value = input(); value.market = { ...value.market, marketId: secondId };
    expect(() => buildEvidenceBrief(value)).toThrow(/match/i);
  });
  it('refuses trade evidence from another market or source', () => {
    const value = input(); value.trades!.data[0].marketId = secondId;
    expect(() => buildEvidenceBrief(value)).toThrow(/match/i);
    const other = input(); other.trades!.mode = 'demo';
    expect(() => buildEvidenceBrief(other)).toThrow(/match/i);
  });
  it('does not let a stored conflicting quote replace the captured API quote', () => {
    const value = input({ history: [makeSnapshot({ yesPrice: '0.99' })] });
    expect(buildEvidenceBrief(value).quotes.yes).toBe('0.45');
  });
  it('escapes untrusted text in Markdown and keeps source links separate', () => {
    const value = input(); value.market.title = '[spoof](javascript:alert(1)) <script>x</script>';
    const text = exportBriefMarkdown(buildEvidenceBrief(value));
    expect(text).not.toContain('[spoof](javascript:alert(1))');
    expect(text).not.toContain('<script>');
  });
  it.each(['=2+2', '+SUM(A1:A2)', '-danger', '@SUM(1)', '\t=1', '\n=1', '\r=1', '   =1'])('neutralizes CSV formula input %j', title => {
    const value = input(); value.market.title = title;
    expect(exportBriefCsv(buildEvidenceBrief(value))).toContain(`"'${title}"`);
  });
  it('escapes CSV quotes and line breaks without discarding field content', () => {
    const value = input(); value.market.title = 'An "event", with\nlines';
    expect(exportBriefCsv(buildEvidenceBrief(value))).toContain('"An ""event"", with\nlines"');
  });
});
describe('transaction evidence links', () => {
  it('links only valid 64-byte signatures in live mode', () => {
    const signature = bs58.encode(new Uint8Array(64).fill(4));
    expect(transactionUrl(signature, 'live')).toBe(`https://solscan.io/tx/${signature}`);
    expect(transactionUrl(signature, 'demo')).toBeNull();
    expect(transactionUrl(marketId, 'live')).toBeNull();
    expect(transactionUrl('javascript:alert(1)', 'live')).toBeNull();
    expect(transactionUrl('1'.repeat(10000), 'live')).toBeNull();
  });
});
