import { queryOptions, useQuery } from '@tanstack/react-query';

import { getProduct, searchProducts } from './client';
import type { OffClientError } from './errors';
import type { OffProduct, OffSearchParams, OffSearchResponse } from './types';

const HOUR = 60 * 60 * 1000;

export const offKeys = {
  all: ['off'] as const,
  product: (barcode: string) => [...offKeys.all, 'product', barcode] as const,
  search: (params: OffSearchParams) => [...offKeys.all, 'search', params] as const,
};

export const productQueryOptions = (barcode: string) =>
  queryOptions<OffProduct, OffClientError>({
    queryKey: offKeys.product(barcode),
    queryFn: ({ signal }) => getProduct(barcode, { signal }),
    staleTime: 24 * HOUR,
  });

export const searchQueryOptions = (params: OffSearchParams) =>
  queryOptions<OffSearchResponse, OffClientError>({
    queryKey: offKeys.search(params),
    queryFn: ({ signal }) => searchProducts(params, { signal }),
    staleTime: 6 * HOUR,
  });

/** Product by barcode; idle until a barcode is provided. */
export function useProduct(barcode: string | undefined) {
  return useQuery({ ...productQueryOptions(barcode ?? ''), enabled: !!barcode });
}

export function useProductSearch(params: OffSearchParams, { enabled = true } = {}) {
  return useQuery({ ...searchQueryOptions(params), enabled });
}
