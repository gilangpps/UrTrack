import { useState, useCallback } from 'react';
import type { AxiosResponse } from 'axios';

export function useApi<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (apiFunc: () => Promise<AxiosResponse<T>>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFunc();
      setData(res.data);
      return res.data;
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error, execute, reset };
}
