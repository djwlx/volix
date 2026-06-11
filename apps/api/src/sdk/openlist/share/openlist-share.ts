import { toSnakePageReq, type RequestOpenlist } from '../core/request-openlist';
import type {
  OpenlistCreateShareParams,
  OpenlistIdReq,
  OpenlistListData,
  OpenlistPaginationReq,
  OpenlistShare,
  OpenlistUpdateShareParams,
} from '../core/openlist.types';

export const createOpenlistShareModule = (requestOpenlist: RequestOpenlist) => ({
  listShares: (pageReq?: OpenlistPaginationReq) =>
    requestOpenlist<OpenlistListData<OpenlistShare>>({
      url: '/api/share/list',
      method: 'GET',
      params: toSnakePageReq(pageReq),
    }),
  getShareById: (params: OpenlistIdReq) =>
    requestOpenlist<OpenlistShare>({
      url: '/api/share/get',
      method: 'GET',
      params,
    }),
  createShare: (params: OpenlistCreateShareParams) =>
    requestOpenlist<OpenlistShare>({
      url: '/api/share/create',
      method: 'POST',
      data: {
        path: params.path,
        password: params.password || '',
        expires: params.expires || '',
        remark: params.remark || '',
      },
    }),
  updateShare: (params: OpenlistUpdateShareParams) =>
    requestOpenlist<OpenlistShare>({
      url: '/api/share/update',
      method: 'POST',
      data: params,
    }),
  deleteShare: (params: OpenlistIdReq) =>
    requestOpenlist<null>({
      url: '/api/share/delete',
      method: 'POST',
      data: params,
    }),
  enableShare: (params: OpenlistIdReq) =>
    requestOpenlist<null>({
      url: '/api/share/enable',
      method: 'POST',
      data: params,
    }),
  disableShare: (params: OpenlistIdReq) =>
    requestOpenlist<null>({
      url: '/api/share/disable',
      method: 'POST',
      data: params,
    }),
});
