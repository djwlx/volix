import { UserRole } from '@volix/types';
import { t } from '../../../utils/i18n';
import type { UpdateSystemConfigPayload } from '@volix/types';
import { unauthorized } from '../../shared/http-handler';
import { getSystemConfigData, updateSystemConfigData } from '../service/system-setting.service';

const ensureAdmin = (ctx: any) => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized(t({ id: 'user.admin.only', defaultMessage: '仅管理员可操作' }));
  }
};

export const getSystemConfig: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  return getSystemConfigData();
};

export const updateSystemConfig: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const param = (ctx.request.body || {}) as UpdateSystemConfigPayload;
  return updateSystemConfigData(param);
};
