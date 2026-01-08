import Router from '@koa/router';
import { userController } from '../controller';

const router = new Router({
  prefix: '/user',
});

router.post('/login', userController.login).post('/register', userController.register);

export default router;
