import { useState, useCallback } from "react";

export function useFetchcy<T = unknown, E = unknown>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const execute = useCallback(
    async (fetcher: () => Promise<{ data: T | null; error: E | null }>) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetcher();
        if (result.error) {
          setError(result.error);
          setData(null);
          return { data: null, error: result.error };
        }
        setData(result.data);
        return { data: result.data, error: null };
      } catch (err: unknown) {
        setError(err as E);
        setData(null);
        return { data: null, error: err as E };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { data, error, isLoading, execute };
}
