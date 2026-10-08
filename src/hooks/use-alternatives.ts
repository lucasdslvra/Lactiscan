import { alternativeCategoryTag, alternativesSearchParams, selectAlternatives } from '@/lib/alternatives';
import { useProductSearch, type OffProduct } from '@/lib/off';
import type { VerdictSettings } from '@/lib/verdict';

/**
 * Replacements for a product: same most specific category, sold in France, filtered by the
 * active profile. The filter runs on every render, so a profile change applies without a new
 * request.
 */
export function useAlternatives(product: OffProduct, settings: VerdictSettings) {
  const categoryTag = alternativeCategoryTag(product);
  const search = useProductSearch(alternativesSearchParams(categoryTag ?? ''), {
    enabled: !!categoryTag,
  });
  const alternatives = search.data
    ? selectAlternatives(search.data.products, product.code, settings)
    : [];

  return {
    alternatives,
    /** No category: nothing to search, shown as « aucune alternative ». */
    hasCategory: !!categoryTag,
    isPending: !!categoryTag && search.isPending,
    error: search.error,
    refetch: search.refetch,
  };
}
