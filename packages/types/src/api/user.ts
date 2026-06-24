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
  BANGUMI = 'bangumi',
  AI = 'ai',
  ASTRBOT = 'astrbot',
}

export enum AiProvider {
  OPENAI = 'openai',
  GEMINI = 'gemini',
  DEEPSEEK = 'deepseek',
  CUSTOM = 'custom',
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

export interface BangumiAccountConfigItem {
  baseUrl: string;
  accessToken: string;
}

export interface AiAccountConfigItem {
  provider: AiProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface AstrbotAccountConfigItem {
  baseUrl: string;
  apiKey: string;
  umos?: string[];
}

export interface UserSettingsJson {
  [key: string]: unknown;
}

export interface SystemSettingsJson {
  [key: string]: unknown;
}

export interface AccountConfigMap {
  qbittorrent?: ServiceAccountConfigItem;
  openlist?: ServiceAccountConfigItem;
  smtp?: SmtpAccountConfigItem;
  bangumi?: BangumiAccountConfigItem;
  ai?: AiAccountConfigItem;
  astrbot?: AstrbotAccountConfigItem;
}

export type AccountConfigItem =
  | ServiceAccountConfigItem
  | SmtpAccountConfigItem
  | BangumiAccountConfigItem
  | AiAccountConfigItem
  | AstrbotAccountConfigItem;

export interface UpdateAccountConfigPayload {
  platform: AccountConfigPlatform;
  config: AccountConfigItem;
}

export interface TestAccountConfigPayload {
  platform: AccountConfigPlatform;
  config: AccountConfigItem;
}

export interface TestAccountConfigResponse {
  success: boolean;
  message: string;
}

export interface ListAiModelsPayload {
  baseUrl: string;
  apiKey: string;
}

export interface ListAiModelsResponse {
  models: string[];
}

export interface TranslateTextPayload {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
}

export interface TranslateTextResponse {
  text: string;
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
  registerEmailVerifySmtp?: SmtpAccountConfigItem;
  randomPicDefaultUserId?: string | number;
  logRetentionDays?: number;
  settings?: SystemSettingsJson;
}

export interface UpdateSystemConfigPayload {
  registerEmailVerifyEnabled: boolean;
  registerEmailVerifySmtp?: SmtpAccountConfigItem;
  randomPicDefaultUserId?: string | number;
  logRetentionDays?: number;
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
  settings?: UserSettingsJson;
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
