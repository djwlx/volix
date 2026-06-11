import type { RequestOpenlist } from '../core/request-openlist';
import type {
  OpenlistAddSshKeyParams,
  OpenlistDeleteSshKeyParams,
  OpenlistMeInfo,
  OpenlistSshKeyItem,
  OpenlistUpdateMeParams,
} from '../core/openlist.types';

export const createOpenlistUserModule = (requestOpenlist: RequestOpenlist) => ({
  getMe: () =>
    requestOpenlist<OpenlistMeInfo>({
      url: '/api/me',
      method: 'GET',
    }),
  updateMe: (params: OpenlistUpdateMeParams) =>
    requestOpenlist<null>({
      url: '/api/me/update',
      method: 'POST',
      data: {
        ...params,
        ...(params.otpCode ? { otp_code: params.otpCode } : {}),
      },
    }),
  listMySshKeys: () =>
    requestOpenlist<OpenlistSshKeyItem[]>({
      url: '/api/me/sshkey/list',
      method: 'GET',
    }),
  addMySshKey: (params: OpenlistAddSshKeyParams) =>
    requestOpenlist<OpenlistSshKeyItem>({
      url: '/api/me/sshkey/add',
      method: 'POST',
      data: params,
    }),
  deleteMySshKey: (params: OpenlistDeleteSshKeyParams) =>
    requestOpenlist<null>({
      url: '/api/me/sshkey/delete',
      method: 'POST',
      data: params,
    }),
  listMySessions: () =>
    requestOpenlist<Record<string, unknown>[]>({
      url: '/api/me/sessions',
      method: 'GET',
    }),
  evictMySession: (payload: Record<string, unknown>) =>
    requestOpenlist<null>({
      url: '/api/me/sessions/evict',
      method: 'POST',
      data: payload,
    }),
});
