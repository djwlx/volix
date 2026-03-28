import Router from '@koa/router';
import { http } from '../shared/http-handler';
import { loginUser, registerUser } from './index';

const router = new Router({
  prefix: '/user',
});

router.post('/login', http(loginUser)).post('/register', http(registerUser));

export default router;
