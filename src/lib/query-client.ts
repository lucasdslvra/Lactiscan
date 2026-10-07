import { QueryClient } from '@tanstack/react-query';

import { isOffError, isRetryableOffError } from '@/lib/off';

const MAX_RETRIES = 2;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Non-OFF errors (future sources) keep TanStack's default behaviour.
        const retryable = isOffError(error) ? isRetryableOffError(error) : true;
        return retryable && failureCount < MAX_RETRIES;
      },
    },
  },
});
