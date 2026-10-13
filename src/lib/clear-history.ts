import { clearHistory } from '@/hooks/use-history';
import { offKeys } from '@/lib/off';
import { queryClient } from '@/lib/query-client';
import { queryPersister } from '@/lib/query-persister';

/**
 * « Effacer l'historique » (US-35): the products consulted and every Open Food Facts answer kept
 * for offline use, in memory and on the phone. The profile and the equivalences stay.
 */
export async function clearHistoryAndCache() {
  queryClient.removeQueries({ queryKey: offKeys.all });
  await Promise.all([clearHistory(), queryPersister.removeQueries({ queryKey: offKeys.all })]);
}
