import { create } from 'zustand';
import type { UserInfoResponse } from '@volix/types';

interface UserState {
  user: UserInfoResponse | null;
  loading: boolean;
  error: string | null;
  setUser: (user: UserInfoResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>(set => ({
  user: null,
  loading: false,
  error: null,
  setUser: (user: UserInfoResponse | null) => set({ user, error: null }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  clearUser: () => set({ user: null, error: null, loading: false }),
}));
