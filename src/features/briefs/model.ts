import type { DataMode, Market, ReadResult, Snapshot, Trade } from '../markets/model';
export type BriefInput = { market: Market; read: ReadResult<Market>; history: Snapshot[]; trades?: ReadResult<Trade[]>; generatedAt: number };
export type EvidenceBrief = {
  schemaVersion: 1; product: 'EventScope'; mode: DataMode; generatedAt: number; observedAt: number;
  market: { marketId: string; title: string; description: string; category: string; phase: string; volumeUsdc: string | null; endTime: number | null; resolutionTime: number | null };
  quotes: { yes: string | null; no: string | null }; stale: boolean;
  observation: { startedAt: number | null; samples: number; baselineAt: number | null; deltaPp: string | null };
  tradeReadAt: number | null; tradeReadStale: boolean; evidence: (Trade & { explorerUrl: string | null })[];
  notes: string[]; sources: { label: string; url: string }[];
};
