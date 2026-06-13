import Router from '@koa/router';
import authenticate from '../../../middleware/authenticate';
import { http } from '../http-handler';
import { createWebsocketTicket } from './websocket-ticket.controller';

const router = new Router({
  prefix: '/ws',
});

router.use(authenticate());
router.post('/ticket', http(createWebsocketTicket));

export default router;
