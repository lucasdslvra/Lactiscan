export type OffErrorKind = 'network' | 'timeout' | 'not-found' | 'http';

export abstract class OffError extends Error {
  abstract readonly kind: OffErrorKind;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
    // Keep `instanceof` reliable whatever the class transform used by the bundler.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** No response from the server: offline, DNS failure, TLS error… */
export class OffNetworkError extends OffError {
  readonly kind = 'network';

  constructor(options?: { cause?: unknown }) {
    super('Open Food Facts is unreachable', options);
  }
}

export class OffTimeoutError extends OffError {
  readonly kind = 'timeout';

  constructor(
    readonly timeoutMs: number,
    options?: { cause?: unknown }
  ) {
    super(`Open Food Facts did not answer within ${timeoutMs} ms`, options);
  }
}

/** The barcode is unknown to Open Food Facts (HTTP 404 or `status: 0`). */
export class OffNotFoundError extends OffError {
  readonly kind = 'not-found';

  constructor(readonly barcode: string) {
    super(`Product ${barcode} not found on Open Food Facts`);
  }
}

/**
 * The server answered, but not with a usable payload: 5xx, 429 / 503 rate limiting
 * (OFF serves an HTML page in that case), other 4xx, or malformed JSON.
 */
export class OffHttpError extends OffError {
  readonly kind = 'http';

  constructor(
    readonly status: number,
    message = `Open Food Facts responded with HTTP ${status}`
  ) {
    super(message);
  }
}

/** Discriminated union of every error the client throws; narrow it with `error.kind`. */
export type OffClientError = OffNetworkError | OffTimeoutError | OffNotFoundError | OffHttpError;

export function isOffError(error: unknown): error is OffClientError {
  return error instanceof OffError;
}

/** Transient failures worth retrying; a missing product or a 4xx will not fix itself. */
export function isRetryableOffError(error: unknown): boolean {
  if (!isOffError(error)) return false;
  switch (error.kind) {
    case 'network':
    case 'timeout':
      return true;
    case 'http':
      return error.status === 429 || error.status >= 500;
    case 'not-found':
      return false;
  }
}
