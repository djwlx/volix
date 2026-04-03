import Router from '@koa/router';
import { http } from '../shared/http-handler';
import {
  adminCreateUser,
  adminUpdateUser,
  assignUserRole,
  createRole,
  getAccountConfigs,
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
  setUserRole,
  updateAccountConfig,
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
  .get('/account-configs', http(getAccountConfigs))
  .put('/account-configs', http(updateAccountConfig))
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
