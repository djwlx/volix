import type { UserInfoResponse } from '@volix/types';

export interface SettingOutletContext {
  user?: UserInfoResponse;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
  requestNavigate: (to: string) => void;
  registerLeaveGuard: (guard: (() => boolean) | null) => void;
}
