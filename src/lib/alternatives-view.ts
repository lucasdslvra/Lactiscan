import type { OffClientError } from '@/lib/off';

/** What the alternatives block shows; each state is distinct on screen. */
export type AlternativesView =
  | { kind: 'loading' }
  | { kind: 'error'; error: OffClientError }
  | { kind: 'empty'; reason: 'no-category' | 'no-match' }
  | { kind: 'list'; loadingMore: boolean };

export interface AlternativesViewInput {
  hasCategory: boolean;
  /** The exact category search has not answered yet. */
  isPending: boolean;
  /** The parent category is being searched. */
  isLoadingMore: boolean;
  error: OffClientError | null;
  count: number;
}

/**
 * Results already on screen are never replaced by an error or a spinner; without results, a
 * search in progress shows a spinner, a failed one the error with « Réessayer », and a finished
 * one « aucune alternative trouvée ». The verdict above does not depend on any of it.
 */
export function alternativesView({
  hasCategory,
  isPending,
  isLoadingMore,
  error,
  count,
}: AlternativesViewInput): AlternativesView {
  if (count > 0) return { kind: 'list', loadingMore: isLoadingMore };
  if (!hasCategory) return { kind: 'empty', reason: 'no-category' };
  if (isPending || isLoadingMore) return { kind: 'loading' };
  if (error) return { kind: 'error', error };
  return { kind: 'empty', reason: 'no-match' };
}
