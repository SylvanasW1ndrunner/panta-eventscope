export const publicErrors = {
  NOT_CONFIGURED: ['Live access is not configured', 503],
  ACCESS_UNCONFIRMED: ['Enable Panta live reads in the server configuration', 503],
  INVALID_PARAMS: ['Invalid read parameters', 400],
  UNAUTHORIZED: ['Panta authentication failed. Check the server configuration.', 401],
  FORBIDDEN: ['Panta denied this read. Check account access.', 403],
  NOT_FOUND: ['This market is unavailable', 404],
  RATE_LIMITED: ['Panta reads are paused until the retry deadline', 429],
  BAD_RESPONSE: ['Panta returned an unsupported response', 502],
  TIMEOUT: ['Panta did not respond within eight seconds', 504],
  UPSTREAM_UNAVAILABLE: ['Panta is temporarily unavailable', 502],
} as const;
export type ErrorCode = keyof typeof publicErrors;
export class PantaError extends Error {
  readonly status: number;
  constructor(readonly code: ErrorCode, readonly retryAt?: number) {
    super(publicErrors[code][0]);
    this.status = publicErrors[code][1];
  }
}
export function safeError(error: unknown): PantaError {
  return error instanceof PantaError ? error : new PantaError('UPSTREAM_UNAVAILABLE');
}
