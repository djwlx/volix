import type { AppFeature, LoginUserPayload, RegisterUserPayload, UserRole } from '@volix/types';
export type { LoginUserPayload, RegisterUserPayload } from '@volix/types';

export interface UserEntity {
  id?: string;
  email: string;
  email_verified?: boolean;
  nickname?: string;
  avatar?: string;
  password: string;
  role?: UserRole;
  role_key?: string;
}

export interface UserQueryParams {
  id?: string;
  email?: string;
  email_verified?: boolean;
  password?: string;
  nickname?: string;
  avatar?: string;
  role?: UserRole;
  role_key?: string;
}

export interface CreateUserParams {
  email: string;
  email_verified?: boolean;
  password: string;
  nickname?: string;
  avatar?: string;
  role?: UserRole;
  role_key?: string;
}

export interface RoleEntity {
  id?: string;
  role_key: string;
  role_name: string;
  features?: string;
}

export interface CreateRoleParams {
  role_key: string;
  role_name: string;
  features: string;
}

export interface RoleFeaturesMap {
  roleKey: string;
  features: AppFeature[];
}
