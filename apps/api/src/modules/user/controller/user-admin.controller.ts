import { UserRole } from '@volix/types';
import type {
  AdminCreateUserPayload,
  AdminUpdateUserPayload,
  AssignUserRolePayload,
  SetUserRolePayload,
} from '@volix/types';
import { badRequest, unauthorized } from '../../shared/http-handler';
import { addUser, queryUser, queryUsers, updateUser } from '../service/user.service';
import {
  AVATAR_URL_REGEXP,
  EMAIL_REGEXP,
  getFeaturePermissions,
  parseUserSettingsJson,
  toUserResponse,
} from './shared';

const ensureAdmin = (ctx: any) => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized('仅管理员可操作');
  }
};

export const getUserList: MyMiddleware = async ctx => {
  ensureAdmin(ctx);

  const list = await queryUsers();
  return list.map(item => ({
    id: item.dataValues.id,
    email: item.dataValues.email,
    emailVerified: Boolean(item.dataValues.email_verified),
    nickname: item.dataValues.nickname,
    avatar: item.dataValues.avatar,
    role: (item.dataValues.role || UserRole.USER) as UserRole,
    featurePermissions: getFeaturePermissions((item.dataValues.role || UserRole.USER) as UserRole),
    settings: parseUserSettingsJson(item.dataValues.settings_json),
  }));
};

export const setUserRole: MyMiddleware = async ctx => {
  ensureAdmin(ctx);

  const param = ctx.request.body as SetUserRolePayload;
  const { userId, role } = param;

  if (!userId || !role || !Object.values(UserRole).includes(role as UserRole)) {
    badRequest('参数错误');
  }

  const targetUser = await queryUser({ id: userId });
  if (!targetUser) {
    badRequest('目标用户不存在');
    return;
  }

  if (String(ctx.state.userInfo?.id) === String(userId) && role !== UserRole.ADMIN) {
    badRequest('不能取消自己的管理员权限');
  }

  await updateUser(userId, { role });

  return {
    id: targetUser.dataValues.id,
    email: targetUser.dataValues.email,
    emailVerified: Boolean(targetUser.dataValues.email_verified),
    nickname: targetUser.dataValues.nickname,
    avatar: targetUser.dataValues.avatar,
    role,
    featurePermissions: getFeaturePermissions(role as UserRole),
    settings: parseUserSettingsJson(targetUser.dataValues.settings_json),
  };
};

export const assignUserRole: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const _param = (ctx.request.body || {}) as AssignUserRolePayload;
  badRequest('角色组已下线，请使用系统角色（admin/user）');
};

export const getUserDetail: MyMiddleware = async ctx => {
  ensureAdmin(ctx);

  const id = (ctx.params.id || '').trim();
  if (!id) {
    badRequest('用户ID不能为空');
  }

  const user = await queryUser({ id });
  if (!user) {
    badRequest('用户不存在');
    return;
  }

  return toUserResponse(user.dataValues);
};

export const adminCreateUser: MyMiddleware = async ctx => {
  ensureAdmin(ctx);

  const param = (ctx.request.body || {}) as AdminCreateUserPayload;
  const email = param.email?.trim();
  const password = param.password?.trim();
  const nickname = typeof param.nickname === 'string' ? param.nickname.trim() : undefined;
  const avatar = typeof param.avatar === 'string' ? param.avatar.trim() : undefined;
  const role = (param.role || UserRole.USER) as UserRole;

  if (!email || !password) {
    badRequest('邮箱或密码不能为空');
  }
  if (!EMAIL_REGEXP.test(email)) {
    badRequest('邮箱格式错误');
  }
  if (nickname && nickname.length > 32) {
    badRequest('昵称长度不能超过 32');
  }
  if (avatar && !AVATAR_URL_REGEXP.test(avatar)) {
    badRequest('头像地址必须是 http/https 链接或 /file/ 开头的上传地址');
  }
  if (!Object.values(UserRole).includes(role)) {
    badRequest('系统角色非法');
  }

  const exists = await queryUser({ email });
  if (exists) {
    badRequest('用户已存在');
  }

  const user = await addUser({
    email,
    email_verified: false,
    password,
    nickname,
    avatar,
    role,
    settings_json: '{}',
  });

  return toUserResponse(user.dataValues);
};

export const adminUpdateUser: MyMiddleware = async ctx => {
  ensureAdmin(ctx);

  const id = (ctx.params.id || '').trim();
  if (!id) {
    badRequest('用户ID不能为空');
  }

  const target = await queryUser({ id });
  if (!target) {
    badRequest('用户不存在');
    return;
  }

  const param = (ctx.request.body || {}) as AdminUpdateUserPayload;
  const nextData: Record<string, unknown> = {};

  if (typeof param.nickname === 'string') {
    const nickname = param.nickname.trim();
    if (nickname.length > 32) {
      badRequest('昵称长度不能超过 32');
    }
    nextData.nickname = nickname;
  }

  if (typeof param.avatar === 'string') {
    const avatar = param.avatar.trim();
    if (avatar && !AVATAR_URL_REGEXP.test(avatar)) {
      badRequest('头像地址必须是 http/https 链接或 /file/ 开头的上传地址');
    }
    nextData.avatar = avatar;
  }

  if (param.role !== undefined) {
    if (!Object.values(UserRole).includes(param.role)) {
      badRequest('系统角色非法');
    }
    if (String(ctx.state.userInfo?.id) === id && param.role !== UserRole.ADMIN) {
      badRequest('不能取消自己的管理员权限');
    }
    nextData.role = param.role;
  }

  if (Object.keys(nextData).length === 0) {
    badRequest('未提供可更新字段');
  }

  await updateUser(id, nextData);
  const updated = await queryUser({ id });
  if (!updated) {
    badRequest('用户不存在');
    return;
  }

  return toUserResponse(updated.dataValues);
};
