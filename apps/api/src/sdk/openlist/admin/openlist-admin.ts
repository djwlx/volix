import { toSnakePageReq, type RequestOpenlist } from '../core/request-openlist';
import type {
  OpenlistAdminUser,
  OpenlistDriverInfo,
  OpenlistIdReq,
  OpenlistIndexProgress,
  OpenlistListData,
  OpenlistMetaItem,
  OpenlistNamedValue,
  OpenlistPaginationReq,
  OpenlistSettingItem,
  OpenlistSshKeyItem,
  OpenlistStorage,
} from '../core/openlist.types';

export const createOpenlistAdminModule = (requestOpenlist: RequestOpenlist) => ({
  listUsers: (pageReq?: OpenlistPaginationReq) =>
    requestOpenlist<OpenlistListData<OpenlistAdminUser>>({
      url: '/api/admin/user/list',
      method: 'GET',
      params: toSnakePageReq(pageReq),
    }),
  getUserById: (params: OpenlistIdReq) =>
    requestOpenlist<OpenlistAdminUser>({
      url: '/api/admin/user/get',
      method: 'GET',
      params,
    }),
  createUser: (payload: Record<string, unknown>) =>
    requestOpenlist<OpenlistAdminUser>({
      url: '/api/admin/user/create',
      method: 'POST',
      data: payload,
    }),
  updateUser: (payload: Record<string, unknown>) =>
    requestOpenlist<OpenlistAdminUser>({
      url: '/api/admin/user/update',
      method: 'POST',
      data: payload,
    }),
  deleteUser: (params: OpenlistIdReq) =>
    requestOpenlist<null>({
      url: '/api/admin/user/delete',
      method: 'POST',
      data: params,
    }),
  cancelUserTwoFactor: (params: OpenlistIdReq) =>
    requestOpenlist<null>({
      url: '/api/admin/user/cancel_2fa',
      method: 'POST',
      data: params,
    }),
  clearUserCache: (params: OpenlistIdReq) =>
    requestOpenlist<null>({
      url: '/api/admin/user/del_cache',
      method: 'POST',
      data: params,
    }),
  listUserSshKeys: (params: OpenlistIdReq) =>
    requestOpenlist<OpenlistSshKeyItem[]>({
      url: '/api/admin/user/sshkey/list',
      method: 'GET',
      params,
    }),
  deleteUserSshKey: (payload: Record<string, unknown>) =>
    requestOpenlist<null>({
      url: '/api/admin/user/sshkey/delete',
      method: 'POST',
      data: payload,
    }),
  listStorages: (pageReq?: OpenlistPaginationReq) =>
    requestOpenlist<OpenlistListData<OpenlistStorage>>({
      url: '/api/admin/storage/list',
      method: 'GET',
      params: toSnakePageReq(pageReq),
    }),
  getStorageById: (params: OpenlistIdReq) =>
    requestOpenlist<OpenlistStorage>({
      url: '/api/admin/storage/get',
      method: 'GET',
      params,
    }),
  createStorage: (payload: Record<string, unknown>) =>
    requestOpenlist<OpenlistStorage>({
      url: '/api/admin/storage/create',
      method: 'POST',
      data: payload,
    }),
  updateStorage: (payload: Record<string, unknown>) =>
    requestOpenlist<OpenlistStorage>({
      url: '/api/admin/storage/update',
      method: 'POST',
      data: payload,
    }),
  deleteStorage: (params: OpenlistIdReq) =>
    requestOpenlist<null>({
      url: '/api/admin/storage/delete',
      method: 'POST',
      data: params,
    }),
  enableStorage: (params: OpenlistIdReq) =>
    requestOpenlist<null>({
      url: '/api/admin/storage/enable',
      method: 'POST',
      data: params,
    }),
  disableStorage: (params: OpenlistIdReq) =>
    requestOpenlist<null>({
      url: '/api/admin/storage/disable',
      method: 'POST',
      data: params,
    }),
  reloadStorages: () =>
    requestOpenlist<null>({
      url: '/api/admin/storage/load_all',
      method: 'POST',
    }),
  listDrivers: () =>
    requestOpenlist<OpenlistDriverInfo[]>({
      url: '/api/admin/driver/list',
      method: 'GET',
    }),
  listDriverNames: () =>
    requestOpenlist<string[]>({
      url: '/api/admin/driver/names',
      method: 'GET',
    }),
  getDriverInfo: (params: { driver: string }) =>
    requestOpenlist<OpenlistDriverInfo>({
      url: '/api/admin/driver/info',
      method: 'GET',
      params,
    }),
  listSettings: () =>
    requestOpenlist<OpenlistSettingItem[]>({
      url: '/api/admin/setting/list',
      method: 'GET',
    }),
  getSettingByKey: (params: { key: string }) =>
    requestOpenlist<OpenlistSettingItem>({
      url: '/api/admin/setting/get',
      method: 'GET',
      params,
    }),
  saveSettings: (payload: OpenlistNamedValue[] | Record<string, unknown>) =>
    requestOpenlist<null>({
      url: '/api/admin/setting/save',
      method: 'POST',
      data: payload,
    }),
  deleteSetting: (params: { key: string }) =>
    requestOpenlist<null>({
      url: '/api/admin/setting/delete',
      method: 'POST',
      data: params,
    }),
  resetApiToken: () =>
    requestOpenlist<{ token?: string }>({
      url: '/api/admin/setting/reset_token',
      method: 'POST',
    }),
  listMetas: () =>
    requestOpenlist<OpenlistMetaItem[]>({
      url: '/api/admin/meta/list',
      method: 'GET',
    }),
  getMetaById: (params: OpenlistIdReq) =>
    requestOpenlist<OpenlistMetaItem>({
      url: '/api/admin/meta/get',
      method: 'GET',
      params,
    }),
  createMeta: (payload: Record<string, unknown>) =>
    requestOpenlist<OpenlistMetaItem>({
      url: '/api/admin/meta/create',
      method: 'POST',
      data: payload,
    }),
  updateMeta: (payload: Record<string, unknown>) =>
    requestOpenlist<OpenlistMetaItem>({
      url: '/api/admin/meta/update',
      method: 'POST',
      data: payload,
    }),
  deleteMeta: (params: OpenlistIdReq) =>
    requestOpenlist<null>({
      url: '/api/admin/meta/delete',
      method: 'POST',
      data: params,
    }),
  buildSearchIndex: (payload?: Record<string, unknown>) =>
    requestOpenlist<null>({
      url: '/api/admin/index/build',
      method: 'POST',
      data: payload || {},
    }),
  updateSearchIndex: (payload?: Record<string, unknown>) =>
    requestOpenlist<null>({
      url: '/api/admin/index/update',
      method: 'POST',
      data: payload || {},
    }),
  stopSearchIndexing: () =>
    requestOpenlist<null>({
      url: '/api/admin/index/stop',
      method: 'POST',
    }),
  clearSearchIndex: () =>
    requestOpenlist<null>({
      url: '/api/admin/index/clear',
      method: 'POST',
    }),
  getSearchIndexProgress: () =>
    requestOpenlist<OpenlistIndexProgress>({
      url: '/api/admin/index/progress',
      method: 'GET',
    }),
});
