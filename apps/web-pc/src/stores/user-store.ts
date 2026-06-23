import { create } from 'zustand';
import { translateClient } from '@/i18n';
import type { UserInfoResponse } from '@volix/types';
import { getCurrentUser } from '@/services/user';
import { clearAuthToken, getAuthToken, upsertSavedAccount } from '@/utils';

const rememberAccount = (user: UserInfoResponse | null) => {
  const token = getAuthToken();
  if (!token || !user) {
    return;
  }
  upsertSavedAccount({
    id: String(user.id),
    token,
    email: user.email,
    nickname: user.nickname,
    avatar: user.avatar,
  });
};

interface UserState {
  currentUser: UserInfoResponse | null;
  userLoading: boolean;
  userLoaded: boolean;
  authInitialized: boolean;
  authError: string | null;
  initializeAuth: () => Promise<void>;
  refreshCurrentUser: () => Promise<UserInfoResponse | null>;
  setCurrentUser: (user: UserInfoResponse | null) => void;
  setUserLoading: (loading: boolean) => void;
  setAuthError: (error: string | null) => void;
  clearAuth: () => void;
}

export const useUserStore = create<UserState>(set => ({
  currentUser: null,
  userLoading: false,
  userLoaded: false,
  authInitialized: false,
  authError: null,
  initializeAuth: async () => {
    const token = getAuthToken();

    if (!token) {
      set({
        currentUser: null,
        userLoading: false,
        userLoaded: true,
        authInitialized: true,
        authError: null,
      });
      return;
    }

    set({ userLoading: true, authError: null });

    try {
      const res = await getCurrentUser();
      rememberAccount(res.data);
      set({
        currentUser: res.data,
        userLoading: false,
        userLoaded: true,
        authInitialized: true,
        authError: null,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : translateClient({
              id: 'auth.currentUser.loadFailed',
              defaultMessage: '获取用户信息失败',
            });
      clearAuthToken();
      set({
        currentUser: null,
        userLoading: false,
        userLoaded: true,
        authInitialized: true,
        authError: message,
      });
    }
  },
  refreshCurrentUser: async () => {
    set({ userLoading: true, authError: null });
    try {
      const res = await getCurrentUser();
      rememberAccount(res.data);
      set({
        currentUser: res.data,
        userLoading: false,
        userLoaded: true,
        authInitialized: true,
        authError: null,
      });
      return res.data;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : translateClient({
              id: 'auth.currentUser.loadFailed',
              defaultMessage: '获取用户信息失败',
            });
      clearAuthToken();
      set({
        currentUser: null,
        userLoading: false,
        userLoaded: true,
        authInitialized: true,
        authError: message,
      });
      return null;
    }
  },
  setCurrentUser: (user: UserInfoResponse | null) =>
    set({
      currentUser: user,
      authError: null,
      userLoaded: true,
      authInitialized: true,
    }),
  setUserLoading: (loading: boolean) => set({ userLoading: loading }),
  setAuthError: (error: string | null) => set({ authError: error }),
  clearAuth: () =>
    set({
      currentUser: null,
      userLoading: false,
      userLoaded: true,
      authInitialized: true,
      authError: null,
    }),
}));
