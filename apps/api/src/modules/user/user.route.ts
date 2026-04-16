import Router from '@koa/router';
import { http } from '../shared/http-handler';
import {
  adminCreateUser,
  adminUpdateUser,
  assignUserRole,
  createRole,
  getAccountConfigs,
  getAiModelList,
  getRegisterConfig,
  getCurrentUser,
  getUserDetail,
  getRoleList,
  getSystemConfig,
  getUserList,
  loginUser,
  registerUser,
  removeRole,
  sendRegisterCode,
  sendCurrentUserEmailVerifyCode,
  setUserRole,
  testAccountConfig,
  updateAccountConfig,
  verifyCurrentUserEmail,
  updateCurrentUserProfile,
  updateRoleInfo,
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
  .post('/account-configs/ai-models', http(getAiModelList))
  .put('/account-configs', http(updateAccountConfig))
  .post('/account-configs/test', http(testAccountConfig))
  .get('/system-config', http(getSystemConfig))
  .put('/system-config', http(updateSystemConfig))
  .put('/profile', http(updateCurrentUserProfile))
  .get('/list', http(getUserList))
  .put('/role', http(setUserRole))
  .post('/admin-create', http(adminCreateUser))
  .get('/roles', http(getRoleList))
  .post('/roles', http(createRole))
  .put('/roles/:roleKey', http(updateRoleInfo))
  .delete('/roles/:roleKey', http(removeRole))
  .put('/assign-role', http(assignUserRole))
  .get('/:id', http(getUserDetail))
  .put('/:id', http(adminUpdateUser));

export default router;
