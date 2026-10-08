import { OFF_BASE_URL, OFF_PRODUCT_FIELDS, OFF_TIMEOUT_MS, OFF_USER_AGENT } from './config';
import { OffHttpError, OffNetworkError, OffNotFoundError, OffTimeoutError } from './errors';
import type {
  OffProduct,
  OffProductResponse,
  OffSearchParams,
  OffSearchResponse,
  OffTaxonomyResponse,
} from './types';

export interface OffRequestOptions {
  /** Cancellation from the caller (TanStack Query passes one to every queryFn). */
  signal?: AbortSignal;
  timeoutMs?: number;
}

type QueryParams = Record<string, string | number | undefined>;

interface RawResponse {
  status: number;
  ok: boolean;
  /** Parsed JSON, or `undefined` when the body is not JSON (OFF serves HTML on 503). */
  body: unknown;
}

/** Product endpoints get `fields=` the fields MilkApp reads; other endpoints pass their own. */
function buildUrl(path: string, params: QueryParams): string {
  const withFields: QueryParams = { fields: OFF_PRODUCT_FIELDS.join(','), ...params };
  const query = Object.entries(withFields)
    .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return `${OFF_BASE_URL}${path}?${query}`;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/**
 * Single entry point for every Open Food Facts call: sets the User-Agent, restricts
 * `fields`, enforces a timeout and turns transport failures into typed errors.
 * A cancellation requested by the caller is rethrown untouched.
 */
async function request(
  path: string,
  params: QueryParams,
  { signal, timeoutMs = OFF_TIMEOUT_MS }: OffRequestOptions
): Promise<RawResponse> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const forwardAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener('abort', forwardAbort);

  try {
    const response = await fetch(buildUrl(path, params), {
      headers: { Accept: 'application/json', 'User-Agent': OFF_USER_AGENT },
      signal: controller.signal,
    });
    // Reading the body stays under the timeout too.
    const text = await response.text();
    return { status: response.status, ok: response.ok, body: parseJson(text) };
  } catch (cause) {
    if (timedOut) throw new OffTimeoutError(timeoutMs, { cause });
    if (signal?.aborted) throw cause;
    throw new OffNetworkError({ cause });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forwardAbort);
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** `GET /api/v2/product/{barcode}` */
export async function getProduct(
  barcode: string,
  options: OffRequestOptions = {}
): Promise<OffProduct> {
  const { status, ok, body } = await request(
    `/api/v2/product/${encodeURIComponent(barcode)}`,
    {},
    options
  );
  const payload = isObject(body) ? (body as Partial<OffProductResponse>) : undefined;

  // Unknown barcode → 404 + `status: 0`; malformed barcode → 200 + `status: 0`.
  if (status === 404 || payload?.status === 0) throw new OffNotFoundError(barcode);
  if (!ok) throw new OffHttpError(status);
  if (!payload?.product) throw new OffHttpError(status, 'Malformed product response');
  return payload.product;
}

/** `GET /api/v2/search` */
export async function searchProducts(
  { categoryTag, countryTag, sortBy, page, pageSize }: OffSearchParams,
  options: OffRequestOptions = {}
): Promise<OffSearchResponse> {
  const { status, ok, body } = await request(
    '/api/v2/search',
    {
      categories_tags: categoryTag,
      countries_tags: countryTag,
      sort_by: sortBy,
      page,
      page_size: pageSize,
    },
    options
  );

  if (!ok) throw new OffHttpError(status);
  if (!isObject(body) || !Array.isArray(body.products)) {
    throw new OffHttpError(status, 'Malformed search response');
  }
  return body as unknown as OffSearchResponse;
}

/**
 * `GET /api/v2/taxonomy` — direct parents of a category, e.g. `en:wholemeal-sliced-breads` →
 * `['en:sliced-breads', 'en:wholemeal-breads']`. Empty for a root or unknown category.
 */
export async function getCategoryParents(
  categoryTag: string,
  options: OffRequestOptions = {}
): Promise<string[]> {
  const { status, ok, body } = await request(
    '/api/v2/taxonomy',
    { tagtype: 'categories', tags: categoryTag, fields: 'parents' },
    options
  );

  if (!ok) throw new OffHttpError(status);
  if (!isObject(body)) throw new OffHttpError(status, 'Malformed taxonomy response');
  const parents = (body as OffTaxonomyResponse)[categoryTag]?.parents;
  return Array.isArray(parents) ? parents.filter((tag) => typeof tag === 'string') : [];
}
