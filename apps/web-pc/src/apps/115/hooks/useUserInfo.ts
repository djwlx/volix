import { useEffect, useState } from 'react';
import { get115UserInfo } from '@/services/115';
import type { Account115UserInfo } from '@volix/types';

export function useUserInfo() {
  const [data, setData] = useState<Account115UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetch = async () => {
    try {
      setLoading(true);
      const res = await get115UserInfo();
      if (res.code === 0) {
        setData(res.data);
      }
      return res;
    } catch (err) {
      setIsError(true);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  return { data, loading, isError, refetch: fetch };
}
