import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { UserRole } from '@volix/types';
import { useAppShellStore, useUserStore } from '@/stores';

export function useAppPageContext() {
  const navigate = useNavigate();
  const user = useUserStore(state => state.currentUser);
  const refreshUser = useUserStore(state => state.refreshCurrentUser);
  const leaveGuard = useAppShellStore(state => state.leaveGuard);
  const setLeaveGuard = useAppShellStore(state => state.setLeaveGuard);

  const requestNavigate = useCallback(
    (to: string) => {
      if (leaveGuard && !leaveGuard()) {
        return;
      }
      navigate(to);
    },
    [leaveGuard, navigate]
  );

  const registerLeaveGuard = useCallback(
    (guard: (() => boolean) | null) => {
      setLeaveGuard(guard);
    },
    [setLeaveGuard]
  );

  return {
    user: user || undefined,
    isAdmin: user?.role === UserRole.ADMIN,
    refreshUser,
    requestNavigate,
    registerLeaveGuard,
  };
}
