import type { UseQueryResult } from '@tanstack/react-query';
import { vi } from 'vitest';

export const createMockQueryResult = <T>(
  data: T | undefined,
  options: {
    isLoading?: boolean;
    isError?: boolean;
    error?: Error | null;
  } = {}
): UseQueryResult<T, Error> => {
  const { isLoading = false, isError = false, error = null } = options;
  
  return {
    data,
    isLoading,
    isError,
    isPending: isLoading,
    isLoadingError: isError && isLoading,
    isRefetchError: isError && !isLoading,
    isSuccess: !isError && !isLoading && data !== undefined,
    isFetching: false,
    isRefetching: false,
    error,
    refetch: vi.fn(),
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: isError ? Date.now() : 0,
    failureCount: isError ? 1 : 0,
    failureReason: isError ? error : null,
    fetchStatus: isLoading ? 'fetching' : 'idle',
    status: isLoading ? 'pending' : isError ? 'error' : 'success'
  } as UseQueryResult<T, Error>;
}; 