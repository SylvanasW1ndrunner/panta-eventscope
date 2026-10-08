import type { DataMode } from '../markets/model';
import bs58 from 'bs58';
export function transactionUrl(signature: string, mode: DataMode): string | null {
  if (mode !== 'live' || typeof signature !== 'string' || signature.length < 64 || signature.length > 88) return null;
  try { return bs58.decode(signature).length === 64 ? `https://solscan.io/tx/${signature}` : null; } catch { return null; }
}
