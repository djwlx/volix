import { useEffect, useState } from 'react';
import { useUserStore } from '@/stores/user-store';
import { isAuthenticated } from '@/utils';

/**
 * 自定义钩子：获取和初始化用户信息
 * - 第一次调用时从 API 获取用户信息并存于 store
 * - 后续调用直接使用 store 中的用户信息
 * @param fetchIfEmpty 是否在 store 中没有用户信息时自动获取，默认 true
 */
export function useUser(fetchIfEmpty = true) {
  const currentUser = useUserStore(state => state.currentUser);
  const loading = useUserStore(state => state.userLoading);
  const error = useUserStore(state => state.authError);
  const initializeAuth = useUserStore(state => state.initializeAuth);
  const clearAuth = useUserStore(state => state.clearAuth);
  const authInitialized = useUserStore(state => state.authInitialized);

  const [unauthorized, setUnauthorized] = useState(false);
  const authed = isAuthenticated();

  useEffect(() => {
    const handleUnauthorized = () => {
      setUnauthorized(true);
      clearAuth();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [clearAuth]);

  useEffect(() => {
    if (!authed) {
      clearAuth();
    }
  }, [authed, clearAuth]);

  useEffect(() => {
    if (!fetchIfEmpty || unauthorized || !authed || authInitialized) {
      return;
    }
    void initializeAuth();
  }, [authed, fetchIfEmpty, unauthorized, authInitialized, initializeAuth]);

  return { user: currentUser, currentUser, loading, error, authed };
}
