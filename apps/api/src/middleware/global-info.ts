import { queryUser } from '../modules/user';
import { UserRole } from '@volix/types';

// 权限校验中间件，鉴权通过之后，将用户信息保存在state中方便后续操作没有权限返回401
const getGlobalInfo = (): MyMiddleware => {
  return async (ctx, next) => {
    const userId = ctx.state.userInfo?.id;
    if (!userId) {
      return next();
    }
    const userInfo = await queryUser({ id: userId });
    if (userInfo && userInfo.dataValues.id !== undefined && userInfo.dataValues.id !== null && userInfo.dataValues.email) {
      ctx.state.userInfo = {
        id: userInfo.dataValues.id,
        email: userInfo.dataValues.email,
        nickname: userInfo.dataValues.nickname,
        avatar: userInfo.dataValues.avatar,
        role: (userInfo.dataValues.role || UserRole.USER) as UserRole,
        roleKey: userInfo.dataValues.role_key,
      };
    }
    next();
  };
};

export default getGlobalInfo;
