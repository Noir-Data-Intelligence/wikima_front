import { QueryClient } from '@tanstack/react-query';

// Don't retry client errors (401/403/404/422): they won't succeed on a retry.
// 404 in particular is expected today for entities whose backend module isn't
// built yet (Task, Invoice, Document, … land in M4+); those queries should fail
// fast and fall back to their empty default instead of hammering the API.
function retry(failureCount, error) {
  const status = error?.status;
  if (typeof status === 'number' && status >= 400 && status < 500) return false;
  return failureCount < 1;
}

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry,
    },
  },
});
