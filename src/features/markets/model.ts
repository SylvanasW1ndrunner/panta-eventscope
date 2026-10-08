export type DataMode = 'live' | 'demo';
export type MarketPhase = 'primary' | 'secondary' | 'resolved' | 'cancelled' | 'unknown';
export type MarketQuery = { category?: string; status?: Exclude<MarketPhase, 'unknown'>; cursor?: string; limit?: number };
export type Market = {
  marketId: string; category: string; title: string; description: string; images: string[];
  phase: MarketPhase; sourcePhase: string; marketType: string; region: string;
  startTime: number | null; endTime: number | null; resolutionTime: number | null;
  resolved: boolean; status: string; volumeUsdc: string | null; campaignId: string | null;
  createdByPartner: boolean; yesPrice: string | null; noPrice: string | null;
  primaryYesPrice: string | null; primaryNoPrice: string | null;
  secondaryYesPrice: string | null; secondaryNoPrice: string | null;
};
export type CatalogPage = { items: Market[]; nextCursor: string | null };
export type Trade = {
  id: string; marketId: string; wallet: string; isPrimary: boolean;
  yesAmount: string | null; noAmount: string | null; feePaid: string | null;
  blockTime: number | null; signature: string; quoteAsset: string;
};
export type Snapshot = { marketId: string; mode: DataMode; phase: MarketPhase; observedAt: number; yesPrice: string | null; noPrice: string | null };
export type ReadResult<T> = { data: T; mode: DataMode; fetchedAt: number; ageMs: number; stale: boolean; warnings: string[]; retryAt?: number };
