import { createHash } from 'crypto';
import type { AxiosRequestConfig } from 'axios';
import request from '../../utils/request';

const OPENLIST_HASH_SUFFIX = '-https://github.com/alist-org/alist';

export interface CreateOpenlistSdkOptions {
  apiHost: string;
  token?: string;
}

export interface OpenlistApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface OpenlistLoginParams {
  username: string;
  password: string;
  otpCode?: string;
}

export interface OpenlistMeInfo {
  id: number;
  username: string;
  role: number;
  disabled: boolean;
  permission: number;
  base_path?: string;
  otp?: boolean;
}

export interface OpenlistFsObject {
  name: string;
  size: number;
  is_dir: boolean;
  modified: string;
  created?: string;
  sign?: string;
  thumb?: string;
  type?: number;
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

export interface OpenlistFsListData {
  content: OpenlistFsObject[];
  total?: number;
  readme?: string;
  write?: boolean;
  provider?: string;
}

export interface OpenlistFsGetData {
  name: string;
  size: number;
  is_dir: boolean;
  modified: string;
  created?: string;
  raw_url?: string;
  sign?: string;
  provider?: string;
  related?: OpenlistFsObject[];
}

export interface OpenlistFsRenameParams {
  path: string;
  name: string;
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

export interface OpenlistStorage {
  id: number;
  mount_path: string;
  order?: number;
  driver?: string;
  disabled?: boolean;
}

export interface OpenlistPaginationReq {
  page?: number;
  perPage?: number;
}

export interface OpenlistListData<T> {
  content: T[];
  total: number;
}

export interface OpenlistShare {
  id: number;
  name?: string;
  path?: string;
  enabled?: boolean;
  created_at?: string;
}

const toSnakePageReq = (params?: OpenlistPaginationReq) => {
  return {
    page: params?.page ?? 1,
    per_page: params?.perPage ?? 20,
  };
};

export const hashOpenlistPassword = (plainPassword: string) => {
  return createHash('sha256').update(`${plainPassword}${OPENLIST_HASH_SUFFIX}`).digest('hex');
};

export function createOpenlistSdk(options: CreateOpenlistSdkOptions) {
  const normalizedHost = options.apiHost.replace(/\/+$/, '');
  let token = options.token || '';

  const getToken = () => token;
  const setToken = (nextToken?: string) => {
    token = (nextToken || '').trim();
  };
  const clearToken = () => {
    token = '';
  };

  const requestOpenlist = async <T>(config: AxiosRequestConfig, needAuth = true) => {
    if (needAuth && !token) {
      throw new Error('OpenList token 不存在，请先登录');
    }

    const result = await request<OpenlistApiResponse<T>>({
      ...config,
      baseURL: normalizedHost,
      headers: {
        'Content-Type': 'application/json',
        ...(needAuth ? { Authorization: token } : {}),
        ...(config.headers || {}),
      },
    });

    const data = result.data;
    if (!data || data.code !== 200) {
      throw new Error(data?.message || 'OpenList 请求失败');
    }
    return data.data;
  };

  const login = async (params: OpenlistLoginParams) => {
    const data = await requestOpenlist<{ token: string }>(
      {
        url: '/api/auth/login',
        method: 'POST',
        data: {
          username: params.username,
          password: params.password,
          ...(params.otpCode ? { otp_code: params.otpCode } : {}),
        },
      },
      false
    );
    setToken(data.token);
    return data;
  };

  const loginWithHashedPassword = async (username: string, plainPassword: string) => {
    const passwordHash = hashOpenlistPassword(plainPassword);
    const data = await requestOpenlist<{ token: string }>(
      {
        url: '/api/auth/login/hash',
        method: 'POST',
        data: {
          username,
          password: passwordHash,
        },
      },
      false
    );
    setToken(data.token);
    return data;
  };

  const logout = async () => {
    await requestOpenlist<null>({
      url: '/api/auth/logout',
      method: 'POST',
    });
    clearToken();
    return true;
  };

  const getMe = async () => {
    return requestOpenlist<OpenlistMeInfo>({
      url: '/api/me',
      method: 'GET',
    });
  };

  const listFs = async (params: OpenlistFsListParams) => {
    return requestOpenlist<OpenlistFsListData>({
      url: '/api/fs/list',
      method: 'POST',
      data: {
        path: params.path,
        password: params.password || '',
        page: params.page ?? 1,
        per_page: params.perPage ?? 0,
        refresh: params.refresh ?? false,
      },
    });
  };

  const getFs = async (params: OpenlistFsGetParams) => {
    return requestOpenlist<OpenlistFsGetData>({
      url: '/api/fs/get',
      method: 'POST',
      data: {
        path: params.path,
        password: params.password || '',
      },
    });
  };

  const mkdir = async (params: OpenlistFsMkdirParams) => {
    return requestOpenlist<null>({
      url: '/api/fs/mkdir',
      method: 'POST',
      data: {
        path: params.path,
      },
    });
  };

  const rename = async (params: OpenlistFsRenameParams) => {
    return requestOpenlist<null>({
      url: '/api/fs/rename',
      method: 'POST',
      data: {
        path: params.path,
        name: params.name,
      },
    });
  };

  const move = async (params: OpenlistFsMoveCopyParams) => {
    return requestOpenlist<null>({
      url: '/api/fs/move',
      method: 'POST',
      data: {
        src_dir: params.srcDir,
        dst_dir: params.dstDir,
        names: params.names,
      },
    });
  };

  const copy = async (params: OpenlistFsMoveCopyParams) => {
    return requestOpenlist<null>({
      url: '/api/fs/copy',
      method: 'POST',
      data: {
        src_dir: params.srcDir,
        dst_dir: params.dstDir,
        names: params.names,
      },
    });
  };

  const remove = async (params: OpenlistFsRemoveParams) => {
    return requestOpenlist<null>({
      url: '/api/fs/remove',
      method: 'POST',
      data: {
        dir: params.dir,
        names: params.names,
      },
    });
  };

  const listStorages = async (pageReq?: OpenlistPaginationReq) => {
    return requestOpenlist<OpenlistListData<OpenlistStorage>>({
      url: '/api/admin/storage/list',
      method: 'POST',
      data: toSnakePageReq(pageReq),
    });
  };

  const listShares = async (pageReq?: OpenlistPaginationReq) => {
    return requestOpenlist<OpenlistListData<OpenlistShare>>({
      url: '/api/share/list',
      method: 'POST',
      data: toSnakePageReq(pageReq),
    });
  };

  const getPublicSettings = async () => {
    return requestOpenlist<Record<string, string | number | boolean | null>>(
      {
        url: '/api/public/settings',
        method: 'GET',
      },
      false
    );
  };

  return {
    getToken,
    setToken,
    clearToken,
    requestOpenlist,
    login,
    loginWithHashedPassword,
    logout,
    getMe,
    listFs,
    getFs,
    mkdir,
    rename,
    move,
    copy,
    remove,
    listStorages,
    listShares,
    getPublicSettings,
  };
}

export type OpenlistSdk = ReturnType<typeof createOpenlistSdk>;
