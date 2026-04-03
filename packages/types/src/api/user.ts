export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum AppFeature {
  ACCOUNT_115 = 'account115',
  RANDOM_PIC = 'randomPic',
}

export interface LoginUserPayload {
  email: string;
  password: string;
}

export interface RegisterUserPayload {
  email: string;
  password: string;
}

export interface LoginUserResponse {
  token: string;
}

export interface UserInfoResponse {
  id: string | number;
  email: string;
  nickname?: string;
  avatar?: string;
  role: UserRole;
  roleKey?: string;
  featurePermissions: AppFeature[];
}

export interface SetUserRolePayload {
  userId: string | number;
  role: UserRole;
}

export interface UpdateUserProfilePayload {
  nickname?: string;
  avatar?: string;
}

export interface RoleInfoResponse {
  roleKey: string;
  roleName: string;
  features: AppFeature[];
}

export interface CreateRolePayload {
  roleKey?: string;
  roleName: string;
  features: AppFeature[];
}

export interface UpdateRolePayload {
  roleName?: string;
  features?: AppFeature[];
}

export interface AssignUserRolePayload {
  userId: string | number;
  roleKey: string;
}

export interface AdminCreateUserPayload {
  email: string;
  password: string;
  nickname?: string;
  avatar?: string;
  role?: UserRole;
  roleKey?: string;
}

export interface AdminUpdateUserPayload {
  nickname?: string;
  avatar?: string;
  role?: UserRole;
  roleKey?: string;
}
