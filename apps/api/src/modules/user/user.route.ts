import Router from '@koa/router';
import { http } from '../shared/http-handler';
import {
  adminCreateUser,
  adminUpdateUser,
  assignUserRole,
  getAccountConfigs,
  getRegisterConfig,
  getCurrentUser,
  getUserDetail,
  getSystemConfig,
  getUserList,
  loginUser,
  registerUser,
  sendRegisterCode,
  sendCurrentUserEmailVerifyCode,
  setUserRole,
  testAccountConfig,
  updateAccountConfig,
  verifyCurrentUserEmail,
  updateCurrentUserProfile,
  updateSystemConfig,
} from './index';
import authenticate from '../../middleware/authenticate';

const router = new Router({
  prefix: '/user',
});

router
  .post('/login', http(loginUser))
  .post('/register', http(registerUser))
  .get('/register-config', http(getRegisterConfig))
  .post('/register-code', http(sendRegisterCode))
  .use(authenticate())
  .get('/me', http(getCurrentUser))
  .post('/me/email-verify-code', http(sendCurrentUserEmailVerifyCode))
  .post('/me/email-verify', http(verifyCurrentUserEmail))
  .get('/account-configs', http(getAccountConfigs))
  .put('/account-configs', http(updateAccountConfig))
  .post('/account-configs/test', http(testAccountConfig))
  .get('/system-config', http(getSystemConfig))
  .put('/system-config', http(updateSystemConfig))
  .put('/profile', http(updateCurrentUserProfile))
  .get('/list', http(getUserList))
  .put('/role', http(setUserRole))
  .post('/admin-create', http(adminCreateUser))
  .put('/assign-role', http(assignUserRole))
  .get('/:id', http(getUserDetail))
  .put('/:id', http(adminUpdateUser));

export default router;
