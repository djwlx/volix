import { userService } from '../service/user';
import jwt from '../utils/jwt';
import { resError, resSuccess } from '../utils/response';
import { BaseController } from './base-controller';

class UserController extends BaseController {
  login = this.res(async (ctx, next) => {
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
        return token;
      } else {
        resError(ctx, {
          code: 400,
          message: '用户名或密码错误',
        });
      }
    }
  });
  // 注册
  register = this.res(async (ctx, next) => {
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
        return registerUser;
      }
    }
  });
}
const userController = new UserController();
export { userController };
