import { useEffect, useState } from 'react';
import { useUserStore } from '@/stores/user-store';
import { getCurrentUser } from '@/services/user';

/**
 * 自定义钩子：获取和初始化用户信息
 * - 第一次调用时从 API 获取用户信息并存于 store
 * - 后续调用直接使用 store 中的用户信息
 * @param fetchIfEmpty 是否在 store 中没有用户信息时自动获取，默认 true
 */
export function useUser(fetchIfEmpty = true) {
  const user = useUserStore(state => state.user);
  const loading = useUserStore(state => state.loading);
  const error = useUserStore(state => state.error);
  const setUser = useUserStore(state => state.setUser);
  const setLoading = useUserStore(state => state.setLoading);
  const setError = useUserStore(state => state.setError);

  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUnauthorized(true);
      setError('未授权，请重新登录');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [setError]);

  useEffect(() => {
    // 如果已有用户信息或不需要自动获取，则跳过
    if (user || !fetchIfEmpty || unauthorized) return;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const res = await getCurrentUser();
        setUser(res.data);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '获取用户信息失败';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    void fetchUserData();
  }, [fetchIfEmpty, user, unauthorized, setUser, setLoading, setError]);

  return { user, loading, error };
}
