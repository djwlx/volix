import type { LoginUserPayload, RegisterUserPayload, UserRole } from '@volix/types';
export type { LoginUserPayload, RegisterUserPayload } from '@volix/types';

export interface UserEntity {
  id?: string;
  dir_key?: string;
  email: string;
  email_verified?: boolean;
  nickname?: string;
  avatar?: string;
  password: string;
  role?: UserRole;
  role_key?: string;
  account_list?: string;
  rss_config?: string;
  settings_json?: string;
}

export interface UserQueryParams {
  id?: string;
  dir_key?: string;
  email?: string;
  email_verified?: boolean;
  password?: string;
  nickname?: string;
  avatar?: string;
  role?: UserRole;
  role_key?: string;
  account_list?: string;
  rss_config?: string;
}

export interface CreateUserParams {
  dir_key?: string;
  email: string;
  email_verified?: boolean;
  password: string;
  nickname?: string;
  avatar?: string;
  role?: UserRole;
  role_key?: string;
  account_list?: string;
  rss_config?: string;
  settings_json?: string;
}

export interface SystemSettingEntity {
  id?: string | number;
  setting_key: string;
  setting_value?: string;
}
