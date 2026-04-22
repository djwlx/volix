import { create } from 'zustand';

interface AppShellState {
  leaveGuard: (() => boolean) | null;
  setLeaveGuard: (guard: (() => boolean) | null) => void;
}

export const useAppShellStore = create<AppShellState>(set => ({
  leaveGuard: null,
  setLeaveGuard: guard => set({ leaveGuard: guard }),
}));
