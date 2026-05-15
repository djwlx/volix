import { AppFeature, UserRole } from '@volix/types';

export const EMAIL_REGEXP = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const AVATAR_URL_REGEXP = /^(https?:\/\/|\/file\/)/;
export const DEFAULT_USER_FEATURES: AppFeature[] = [AppFeature.RANDOM_PIC];

type UserSettingsJson = Record<string, unknown>;

export const getFeaturePermissions = (systemRole: UserRole | undefined) => {
  if (systemRole === UserRole.ADMIN) {
    return Object.values(AppFeature);
  }
  return DEFAULT_USER_FEATURES;
};

export const parseUserSettingsJson = (raw?: string): UserSettingsJson => {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as UserSettingsJson;
    }
    return {};
  } catch {
    return {};
  }
};

export const toUserResponse = async (data: {
  id?: string | number;
  email?: string;
  email_verified?: boolean;
  nickname?: string;
  avatar?: string;
  role?: UserRole;
  role_key?: string;
  settings_json?: string;
}) => {
  const role = (data.role || UserRole.USER) as UserRole;
  return {
    id: data.id,
    email: data.email,
    emailVerified: Boolean(data.email_verified),
    nickname: data.nickname,
    avatar: data.avatar,
    role,
    featurePermissions: getFeaturePermissions(role),
    settings: parseUserSettingsJson(data.settings_json),
  };
};
