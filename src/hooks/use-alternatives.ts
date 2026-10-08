import {
  MIN_ALTERNATIVES,
  alternativeCategoryTag,
  alternativesSearchParams,
  pickParentCategory,
  selectAlternatives,
  type AlternativeContext,
} from '@/lib/alternatives';
import { EMBEDDED_EQUIVALENCES, equivalenceProducts } from '@/lib/equivalences';
import { useCategoryParents, useProductSearch, type OffProduct } from '@/lib/off';
import type { VerdictSettings } from '@/lib/verdict';

/**
 * Replacements for a product: same most specific category, sold in France, filtered by the
 * active profile. With fewer than three, the parent category is searched, then the
 * equivalences JSON fills in. The filter runs on every render, so a profile change applies
 * without a new request.
 */
export function useAlternatives(product: OffProduct, settings: VerdictSettings) {
  const categoryTag = alternativeCategoryTag(product);
  const context: AlternativeContext = { scannedCode: product.code, categoryTag, settings };

  const exact = useProductSearch(alternativesSearchParams(categoryTag ?? ''), {
    enabled: !!categoryTag,
  });
  const exactProducts = exact.data?.products ?? [];

  // The search endpoint is rate limited: the parent one only runs when it is needed.
  const needsFallback =
    !!exact.data && selectAlternatives({ category: exactProducts }, context).length < MIN_ALTERNATIVES;
  const parents = useCategoryParents(categoryTag ?? '', { enabled: needsFallback });
  const parentTag = parents.data ? pickParentCategory(parents.data, product) : null;
  const parent = useProductSearch(alternativesSearchParams(parentTag ?? ''), {
    enabled: needsFallback && !!parentTag,
  });

  const alternatives = selectAlternatives(
    {
      category: exactProducts,
      parent: parent.data?.products,
      equivalences: equivalenceProducts(EMBEDDED_EQUIVALENCES, [categoryTag, parentTag]),
    },
    context
  );

  const fallbackError = parents.error ?? parent.error;
  const isLoadingMore =
    needsFallback && !fallbackError && (parents.isPending || (!!parentTag && parent.isPending));

  return {
    alternatives,
    /** No list yet: the exact search is running. */
    isPending: !!categoryTag && exact.isPending,
    /** The parent category is being searched, below the results already shown. */
    isLoadingMore,
    // A failed fallback only matters when there is nothing to show.
    error: exact.error ?? (alternatives.length === 0 ? fallbackError : null),
    retry: () => {
      if (exact.error) void exact.refetch();
      if (parents.error) void parents.refetch();
      if (parent.error) void parent.refetch();
    },
  };
}
