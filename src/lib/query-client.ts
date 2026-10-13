import { QueryClient } from '@tanstack/react-query';

import { isOffError, isRetryableOffError } from '@/lib/off';
import { queryPersister } from '@/lib/query-persister';

const MAX_RETRIES = 2;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Non-OFF errors (future sources) keep TanStack's default behaviour.
        const retryable = isOffError(error) ? isRetryableOffError(error) : true;
        return retryable && failureCount < MAX_RETRIES;
      },
      // Kept on the phone for 30 days (US-32). Queries then run « offline first »: a copy read
      // back from the device shows even when the refresh fails.
      persister: queryPersister.persisterFn,
    },
  },
});
