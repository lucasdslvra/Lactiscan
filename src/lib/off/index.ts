export { getProduct, searchProducts, type OffRequestOptions } from './client';
export { OFF_USER_AGENT } from './config';
export {
  OffError,
  OffHttpError,
  OffNetworkError,
  OffNotFoundError,
  OffTimeoutError,
  isOffError,
  isRetryableOffError,
  type OffClientError,
  type OffErrorKind,
} from './errors';
export {
  offKeys,
  productQueryOptions,
  searchQueryOptions,
  useProduct,
  useProductSearch,
} from './queries';
export type { OffProduct, OffSearchParams, OffSearchResponse, OffSortBy } from './types';
