import type { EvidenceBrief } from './model';
const iso = (time: number | null) => time === null ? 'not provided' : new Date(time).toISOString();
const plain = (text: string) => text.replace(/[\\`*_{}\[\]()#+.!|>~<>]/g, '\\$&');
const available = (quote: string | null) => quote === null ? 'unavailable' : `${quote} USDC / share`;
export function exportBriefJson(brief: EvidenceBrief): string { return JSON.stringify(brief, null, 2) + '\n'; }
export function exportBriefMarkdown(brief: EvidenceBrief): string {
  return [
    '# EventScope Evidence Brief', '',
    ...(brief.mode === 'demo' ? ['**FICTIONAL EXAMPLE — sample data, not live market evidence.**', ''] : []),
    `## ${plain(brief.market.title)}`, '', plain(brief.market.description), '',
    `- Market ID: \`${brief.market.marketId}\``, `- Source mode: ${brief.mode}`, `- Phase: ${plain(brief.market.phase)}`,
    `- Detail API read: ${iso(brief.observedAt)}`, `- Brief generated: ${iso(brief.generatedAt)}`, `- Read stale: ${brief.stale ? 'yes' : 'no'}`,
    `- YES quote: ${available(brief.quotes.yes)}`, `- NO quote: ${available(brief.quotes.no)}`,
    `- Catalogue volume: ${brief.market.volumeUsdc ?? 'unavailable'} USDC`,
    `- Market ends: ${iso(brief.market.endTime)}`, `- Scheduled resolution: ${iso(brief.market.resolutionTime)}`, '',
    '## Observed window', '', `- Observation start: ${iso(brief.observation.startedAt)}`, `- Samples: ${brief.observation.samples}`,
    `- Baseline: ${iso(brief.observation.baselineAt)}`, `- YES movement: ${brief.observation.deltaPp === null ? 'not established' : `${brief.observation.deltaPp} percentage points`}`, '',
    '## Trade evidence', '', `Tape API read: ${iso(brief.tradeReadAt)}${brief.tradeReadStale ? ' (stale)' : ''}.`, '',
    ...(brief.evidence.length ? ['| Signature | Time (UTC) | Phase | YES / NO shares | Link |', '| --- | --- | --- | --- | --- |',
      ...brief.evidence.map(row => `| ${plain(row.signature)} | ${iso(row.blockTime)} | ${row.isPrimary ? 'primary' : 'secondary'} | ${row.yesAmount ?? 'unavailable'} / ${row.noAmount ?? 'unavailable'} | ${row.explorerUrl ? `[Explorer](${row.explorerUrl})` : 'No verified-format link'} |`)] : ['No trade records included.']), '',
    '## Interpretation and limits', '', ...brief.notes.map(note => `- ${plain(note)}`), '',
    '## Source contracts', '', ...brief.sources.map(source => `- [${source.label}](${source.url})`), '',
    'Independent EventScope workspace · Powered by Panta.', '',
  ].join('\n');
}
function csvCell(value: unknown): string {
  let text = value == null ? '' : String(value);
  if (/^[ \t\r\n\uFEFF]*[=+\-@]|^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export function exportBriefCsv(brief: EvidenceBrief): string {
  const rows: unknown[][] = [['section', 'field', 'value']];
  const fields: Record<string, unknown> = {
    mode: brief.mode, marketId: brief.market.marketId, title: brief.market.title, description: brief.market.description,
    observedAt: iso(brief.observedAt), generatedAt: iso(brief.generatedAt), stale: brief.stale, phase: brief.market.phase,
    yesQuoteUsdc: brief.quotes.yes, noQuoteUsdc: brief.quotes.no, catalogueVolumeUsdc: brief.market.volumeUsdc,
    endTime: iso(brief.market.endTime), scheduledResolution: iso(brief.market.resolutionTime),
    observationStart: iso(brief.observation.startedAt), samples: brief.observation.samples, baselineAt: iso(brief.observation.baselineAt),
    yesDeltaPercentagePoints: brief.observation.deltaPp, tapeReadAt: iso(brief.tradeReadAt), tapeStale: brief.tradeReadStale,
  };
  for (const [field, value] of Object.entries(fields)) rows.push(['brief', field, value]);
  brief.notes.forEach((note, i) => rows.push(['note', i + 1, note]));
  brief.evidence.forEach((trade, i) => { for (const [field, value] of Object.entries(trade)) rows.push([`trade-${i + 1}`, field, field === 'blockTime' ? iso(value as number | null) : value]); });
  return rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
