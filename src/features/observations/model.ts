import type { Snapshot } from '../markets/model';
export type { Snapshot } from '../markets/model';
export type SavedWorkspace = { version: 1; watchlist: string[]; compare: string[]; histories: Record<string, Snapshot[]>; thresholdPp: number; storageNotice?: string | null };
export type StorageResult = { saved: boolean; notice: string | null };
export type AlertState = { crossing: boolean; lastEmittedAt: number | null };
export type AlertEvaluation = { state: AlertState; status: 'ready' | 'warming-up' | 'unavailable' | 'stale'; deltaPp: string | null; triggered: boolean; direction: 'up' | 'down' | null; baselineAt: number | null };
