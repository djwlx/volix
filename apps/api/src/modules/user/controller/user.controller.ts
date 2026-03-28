import type { LoginUserPayload, RegisterUserPayload } from '@volix/types';
import jwt from '../../../utils/jwt';
import { badRequest } from '../../shared/http-handler';
import { addUser, queryUser } from '../service/user.service';

const EMAIL_REGEXP = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const loginUser: MyMiddleware = async ctx => {
  const param = ctx.request.body as LoginUserPayload;
  const { email, password } = param;
  if (!email || !password) {
    badRequest('邮箱或密码不能为空');
  }
  if (!EMAIL_REGEXP.test(email)) {
    badRequest('邮箱格式错误');
  }

  const findOne = await queryUser({
    email,
    password,
  });
  if (!findOne) {
    badRequest('邮箱或密码错误');
  }
  const userId = findOne?.dataValues?.id;
  if (userId === undefined || userId === null) {
    badRequest('用户信息异常');
  }

  return jwt.setToken({ id: userId as string | number });
};

export const registerUser: MyMiddleware = async ctx => {
  const param = ctx.request.body as RegisterUserPayload;
  const { email, password } = param;
  if (!email || !password) {
    badRequest('邮箱或密码不能为空');
  }
  if (!EMAIL_REGEXP.test(email)) {
    badRequest('邮箱格式错误');
  }

  const findOne = await queryUser({
    email,
  });
  if (findOne) {
    badRequest('用户已存在');
  }

  return addUser({
    email,
    password,
  });
};
