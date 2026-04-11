export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum AppFeature {
  ACCOUNT_115 = 'account115',
  RANDOM_PIC = 'randomPic',
}

export enum AccountConfigPlatform {
  QBITTORRENT = 'qbittorrent',
  OPENLIST = 'openlist',
  SMTP = 'smtp',
}

export interface ServiceAccountConfigItem {
  baseUrl: string;
  username: string;
  password: string;
}

export interface SmtpAccountConfigItem {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
}

export interface AccountConfigMap {
  qbittorrent?: ServiceAccountConfigItem;
  openlist?: ServiceAccountConfigItem;
  smtp?: SmtpAccountConfigItem;
}

export interface UpdateAccountConfigPayload {
  platform: AccountConfigPlatform;
  config: ServiceAccountConfigItem | SmtpAccountConfigItem;
}

export interface RegisterConfigResponse {
  emailVerificationRequired: boolean;
}

export interface SendRegisterCodePayload {
  email: string;
}

export interface SendRegisterCodeResponse {
  success: boolean;
}

export interface VerifyCurrentUserEmailPayload {
  verifyCode: string;
}

export interface SystemConfigResponse {
  registerEmailVerifyEnabled: boolean;
}

export interface UpdateSystemConfigPayload {
  registerEmailVerifyEnabled: boolean;
}

export interface LoginUserPayload {
  email: string;
  password: string;
}

export interface RegisterUserPayload {
  email: string;
  password: string;
  verifyCode?: string;
}

export interface LoginUserResponse {
  token: string;
}

export interface UserInfoResponse {
  id: string | number;
  email: string;
  emailVerified: boolean;
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
