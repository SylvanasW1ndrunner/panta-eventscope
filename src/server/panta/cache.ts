import type { ReadResult } from '../../features/markets/model';
type Entry<T> = { data: T; fetchedAt: number; ttl: number };
export class ReadCache {
  private entries = new Map<string, Entry<unknown>>();
  get<T>(key: string): Entry<T> | undefined {
    const entry = this.entries.get(key);
    if (entry) { this.entries.delete(key); this.entries.set(key, entry); }
    return entry as Entry<T> | undefined;
  }
  put<T>(key: string, entry: Entry<T>) {
    this.entries.delete(key);
    this.entries.set(key, entry);
    if (this.entries.size > 256) this.entries.delete(this.entries.keys().next().value!);
  }
}
export function cachedView<T>(entry: Entry<T>, now: number, stale = false, warnings: string[] = [], retryAt?: number): ReadResult<T> {
  return { data: entry.data, mode: 'live', fetchedAt: entry.fetchedAt, ageMs: Math.max(0, now - entry.fetchedAt), stale, warnings, ...(retryAt ? { retryAt } : {}) };
}
