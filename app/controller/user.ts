import { userService } from '../service/user';
import jwt from '../utils/jwt';
import { resError, resSuccess } from '../utils/response';

interface UserControllerType {
  login: MyMiddleware;
  register: MyMiddleware;
}

const UserController: UserControllerType = {
  login: async (ctx, next) => {
    const param = ctx.request.body;
    if (!param.username || !param.password) {
      resError(ctx, {
        code: 400,
        message: '用户名或密码不能为空',
      });
    } else {
      const findOne: any = await userService.query(param);
      if (findOne) {
        const token = jwt.setToken({ id: findOne.id });
        resSuccess(ctx, {
          data: { token },
          message: '登录成功',
        });
      } else {
        resError(ctx, {
          code: 400,
          message: '用户名或密码错误',
        });
      }
    }
  },
  // 注册
  register: async (ctx, next) => {
    const param = ctx.request.body;
    if (!param.username || !param.password) {
      resError(ctx, {
        code: 400,
        message: '用户名或密码错误',
      });
    } else {
      const findOne = await userService.query(param);
      if (findOne) {
        resError(ctx, {
          code: 400,
          message: '用户已存在',
        });
      } else {
        const registerUser = await userService.add(param);
        resSuccess(ctx, {
          message: '注册成功',
        });
      }
    }
  },
};

export default UserController;
