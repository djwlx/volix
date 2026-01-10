import { useCallback, useEffect, useState } from 'react';
import { get115UserInfo } from '@/services/115';
import type { Account115UserInfo } from '@volix/types';

export function useUserInfo(autoFetch = true) {
  const [data, setData] = useState<Account115UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    setIsError(false);
    try {
      const res = await get115UserInfo();
      if (res.code === 0) {
        setData(res.data);
      } else {
        setData(null);
      }
      return res;
    } catch (err) {
      setIsError(true);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) fetch();
  }, [autoFetch, fetch]);

  return { data, loading, isError, refetch: fetch } as const;
}
