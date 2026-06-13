import { t } from '../../../utils/i18n';
import { unauthorized } from '../http-handler';
import { issueWebsocketTicket } from './ws-ticket.service';

export const createWebsocketTicket: MyMiddleware = async ctx => {
  const userId = String(ctx.state.userInfo?.id || '').trim();
  if (!userId) {
    unauthorized(t({ id: 'auth.unauthorized', defaultMessage: '未登录' }));
  }

  return issueWebsocketTicket(userId);
};
