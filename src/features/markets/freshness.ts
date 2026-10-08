export function readIsStale(read: { fetchedAt: number; stale: boolean }, now: number): boolean {
  return read.stale || !Number.isFinite(read.fetchedAt) || !Number.isFinite(now)
    || now - read.fetchedAt > 60000 || read.fetchedAt > now + 5000;
}
