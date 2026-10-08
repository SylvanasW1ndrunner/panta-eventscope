import type { Snapshot } from '../../src/features/markets/model';

export const NOW = Date.UTC(2026, 9, 8, 10, 0, 0);
export const marketId = '11111111111111111111111111111111';
export const secondId = 'So11111111111111111111111111111111111111112';
export const rawMarket = {
  marketId, category: 'science', title: 'Will the fictional Aurora mission launch in November?',
  description: 'Fictional test event. Not a deployed market.', images: [], phase: 'secondary',
  marketType: 'standard', startTime: 1791000000, endTime: 1795000000,
  resolutionTime: 1795100000, region: 'Global', resolved: false, status: 'open',
  volumeUsdc: '12500.50', campaignId: null, createdByPartner: false,
  yesPrice: '0.45', noPrice: '0.55', primaryYesPrice: null, primaryNoPrice: null,
  secondaryYesPrice: '0.45', secondaryNoPrice: '0.55',
};
export const rawTrade = {
  id: 1, marketId, wallet: secondId, isPrimary: false,
  yesAmount: '10.00', noAmount: '0', feePaid: '0.05',
  blockTime: 1791000010, signature: '1'.repeat(64), quoteAsset: 'USDC',
};
export const makeSnapshot = (overrides: Partial<Snapshot> = {}): Snapshot => ({
  marketId, mode: 'live', phase: 'secondary', observedAt: NOW,
  yesPrice: '0.45', noPrice: '0.55', ...overrides,
});
