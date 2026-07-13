import useSWR from 'swr';
import { fetchPortfolioData } from '@/services/portfolio';

export function usePortfolioSWR() {
  const { data, error, isLoading, mutate } = useSWR(
    'portfolio-data',
    fetchPortfolioData,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    data,
    error,
    isLoading,
    refresh: () => mutate(),
  };
}
