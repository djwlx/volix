import Router from '@koa/router';
import { http } from '../shared/http-handler';
import {
  adminCreateUser,
  adminUpdateUser,
  assignUserRole,
  createRole,
  getCurrentUser,
  getUserDetail,
  getRoleList,
  getUserList,
  loginUser,
  registerUser,
  removeRole,
  setUserRole,
  updateCurrentUserProfile,
  updateRoleInfo,
} from './index';
import authenticate from '../../middleware/authenticate';

const router = new Router({
  prefix: '/user',
});

router
  .post('/login', http(loginUser))
  .post('/register', http(registerUser))
  .use(authenticate())
  .get('/me', http(getCurrentUser))
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
