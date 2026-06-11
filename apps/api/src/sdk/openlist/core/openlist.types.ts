export interface CreateOpenlistSdkOptions {
  apiHost: string;
  token?: string;
  userAgent?: string;
  minRequestIntervalMs?: number;
}

export interface OpenlistApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface OpenlistPaginationReq {
  page?: number;
  perPage?: number;
}

export interface OpenlistListData<T> {
  content: T[];
  total: number;
}

export interface OpenlistNamedValue {
  key: string;
  value?: string | number | boolean | null;
}

export interface OpenlistIdReq {
  id: number | string;
}

export interface OpenlistLoginParams {
  username: string;
  password: string;
  otpCode?: string;
}

export interface OpenlistLdapLoginParams extends OpenlistLoginParams {}

export interface OpenlistTokenData {
  token: string;
}

export interface OpenlistTwoFactorSecret {
  secret?: string;
  qrCode?: string;
  url?: string;
}

export interface OpenlistVerifyTwoFactorParams {
  code: string;
}

export interface OpenlistWebauthnCredential {
  id?: string;
  name?: string;
  type?: string;
  created_at?: string;
  last_used_at?: string;
  [key: string]: unknown;
}

export interface OpenlistMeInfo {
  id: number;
  username: string;
  role: number;
  disabled: boolean;
  permission: number;
  base_path?: string;
  otp?: boolean;
  email?: string;
  avatar?: string;
  nickname?: string;
  [key: string]: unknown;
}

export interface OpenlistUpdateMeParams {
  password?: string;
  otpCode?: string;
  [key: string]: unknown;
}

export interface OpenlistSshKeyItem {
  id?: number | string;
  title?: string;
  key: string;
  created_at?: string;
  fingerprint?: string;
  [key: string]: unknown;
}

export interface OpenlistAddSshKeyParams {
  title?: string;
  key: string;
}

export interface OpenlistDeleteSshKeyParams {
  id?: number | string;
  key?: string;
}

export interface OpenlistAdminUser {
  id: number | string;
  username: string;
  role?: number;
  disabled?: boolean;
  permission?: number;
  email?: string;
  base_path?: string;
  [key: string]: unknown;
}

export interface OpenlistStorage {
  id: number;
  mount_path: string;
  order?: number;
  driver?: string;
  disabled?: boolean;
  [key: string]: unknown;
}

export interface OpenlistDriverInfo {
  name?: string;
  common?: Record<string, unknown>;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface OpenlistSettingItem {
  key: string;
  value?: string | number | boolean | null;
  group?: string;
  help?: string;
  [key: string]: unknown;
}

export interface OpenlistMetaItem {
  id: number | string;
  path?: string;
  [key: string]: unknown;
}

export interface OpenlistIndexProgress {
  status?: string;
  done?: number;
  total?: number;
  message?: string;
  [key: string]: unknown;
}

export interface OpenlistFsObject {
  id?: string;
  path?: string;
  name: string;
  size: number;
  is_dir: boolean;
  modified: string;
  created?: string;
  sign?: string;
  thumb?: string;
  type?: number;
  hash_info?: Record<string, unknown> | null;
  provider?: string;
  raw_url?: string;
  related?: OpenlistFsObject[];
  [key: string]: unknown;
}

export interface OpenlistFsListParams {
  path: string;
  password?: string;
  page?: number;
  perPage?: number;
  refresh?: boolean;
}

export interface OpenlistFsGetParams {
  path: string;
  password?: string;
}

export interface OpenlistFsSearchParams extends OpenlistPaginationReq {
  parent: string;
  keywords: string;
  scope?: number;
  password?: string;
}

export interface OpenlistDirectoryTreeParams {
  path: string;
  password?: string;
}

export interface OpenlistFsOtherParams {
  path: string;
  method?: string;
  password?: string;
}

export interface OpenlistFsListData {
  content: OpenlistFsObject[];
  total?: number;
  readme?: string;
  write?: boolean;
  provider?: string;
  header?: string;
}

export interface OpenlistFsGetData extends OpenlistFsObject {
  mount_details?: Record<string, unknown>;
}

export interface OpenlistFsRenameParams {
  path: string;
  name: string;
}

export interface OpenlistFsBatchRenameParams {
  srcDir: string;
  renameObjects: Array<{
    srcName: string;
    newName: string;
  }>;
}

export interface OpenlistFsRegexRenameParams {
  srcDir: string;
  names: string[];
  regex: string;
  replace: string;
}

export interface OpenlistFsMkdirParams {
  path: string;
}

export interface OpenlistFsMoveCopyParams {
  srcDir: string;
  dstDir: string;
  names: string[];
}

export interface OpenlistFsRemoveParams {
  dir: string;
  names: string[];
}

export interface OpenlistUploadStreamParams {
  path: string;
  filename: string;
  stream: NodeJS.ReadableStream;
  password?: string;
  asTask?: boolean;
}

export interface OpenlistUploadFormParams {
  path: string;
  formData: unknown;
  headers?: Record<string, string>;
  password?: string;
  asTask?: boolean;
}

export interface OpenlistOfflineDownloadTaskParams {
  path: string;
  urls: string[];
  tool?: string;
  deletePolicy?: string;
}

export interface OpenlistArchiveListParams {
  path: string;
  password?: string;
  page?: number;
  perPage?: number;
}

export interface OpenlistArchiveDecompressParams {
  srcDir: string;
  name: string;
  dstDir: string;
  password?: string;
}

export interface OpenlistOfflineDownloadTool {
  name?: string;
  type?: string;
  [key: string]: unknown;
}

export interface OpenlistShare {
  id: number | string;
  name?: string;
  path?: string;
  enabled?: boolean;
  created_at?: string;
  password?: string;
  [key: string]: unknown;
}

export interface OpenlistCreateShareParams {
  path: string;
  password?: string;
  expires?: string;
  remark?: string;
}

export interface OpenlistUpdateShareParams extends OpenlistIdReq {
  password?: string;
  expires?: string;
  remark?: string;
  enabled?: boolean;
}
