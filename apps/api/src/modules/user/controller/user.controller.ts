import { UserRole } from '@volix/types';
import { AppFeature } from '@volix/types';
import type {
  AdminCreateUserPayload,
  AdminUpdateUserPayload,
  AssignUserRolePayload,
  CreateRolePayload,
  LoginUserPayload,
  RegisterUserPayload,
  SetUserRolePayload,
  UpdateRolePayload,
  UpdateUserProfilePayload,
} from '@volix/types';
import jwt from '../../../utils/jwt';
import { badRequest, unauthorized } from '../../shared/http-handler';
import {
  addRole,
  addUser,
  countUsers,
  countUsersByRoleKey,
  deleteRole,
  parseRoleFeatures,
  queryRole,
  queryRoles,
  queryUser,
  queryUsers,
  stringifyRoleFeatures,
  updateRole,
  updateUser,
} from '../service/user.service';

const EMAIL_REGEXP = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AVATAR_URL_REGEXP = /^(https?:\/\/|\/file\/)/;
const DEFAULT_ROLE_KEY = 'default';
const ROLE_KEY_PREFIX = 'role';

const ensureDefaultRole = async () => {
  const role = await queryRole({
    role_key: DEFAULT_ROLE_KEY,
  });
  if (role) {
    return role;
  }

  return addRole({
    role_key: DEFAULT_ROLE_KEY,
    role_name: '默认角色',
    features: stringifyRoleFeatures([AppFeature.ACCOUNT_115, AppFeature.RANDOM_PIC]),
  });
};

const getFeaturePermissionsByRoleKey = async (roleKey?: string) => {
  if (!roleKey) {
    return [] as AppFeature[];
  }

  const role = await queryRole({
    role_key: roleKey,
  });

  return parseRoleFeatures(role?.dataValues.features);
};

const getFeaturePermissions = async (systemRole: UserRole | undefined, roleKey?: string) => {
  if (systemRole === UserRole.ADMIN) {
    return Object.values(AppFeature);
  }
  return getFeaturePermissionsByRoleKey(roleKey);
};

const normalizeRoleFeatures = (features: unknown) => {
  if (!Array.isArray(features)) {
    badRequest('features 必须是数组');
  }
  const values = features as string[];
  const validSet = new Set(Object.values(AppFeature));
  const invalid = values.find(item => !validSet.has(item as AppFeature));
  if (invalid) {
    badRequest(`非法功能权限: ${invalid}`);
  }
  return Array.from(new Set(values)) as AppFeature[];
};

const buildAutoRoleKey = () => {
  return `${ROLE_KEY_PREFIX}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
};

const toUserResponse = async (data: {
  id?: string | number;
  email?: string;
  nickname?: string;
  avatar?: string;
  role?: UserRole;
  role_key?: string;
}) => {
  const role = (data.role || UserRole.USER) as UserRole;
  const roleKey = data.role_key || DEFAULT_ROLE_KEY;
  return {
    id: data.id,
    email: data.email,
    nickname: data.nickname,
    avatar: data.avatar,
    role,
    roleKey,
    featurePermissions: await getFeaturePermissions(role, roleKey),
  };
};

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

  return {
    token: jwt.setToken({ id: userId as string | number }),
  };
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

  const userCount = await countUsers();
  const role = userCount === 0 ? UserRole.ADMIN : UserRole.USER;

  const user = await addUser({
    email,
    password,
    role,
    role_key: DEFAULT_ROLE_KEY,
  });

  await ensureDefaultRole();

  const featurePermissions = await getFeaturePermissions(
    (user.dataValues.role || role) as UserRole,
    user.dataValues.role_key
  );

  return {
    id: user.dataValues.id,
    email: user.dataValues.email,
    nickname: user.dataValues.nickname,
    avatar: user.dataValues.avatar,
    role: (user.dataValues.role || role) as UserRole,
    roleKey: user.dataValues.role_key,
    featurePermissions,
  };
};

export const getCurrentUser: MyMiddleware = async ctx => {
  const userId = ctx.state.userInfo?.id;
  if (!userId) {
    unauthorized('未登录');
  }

  const user = await queryUser({ id: userId as string | number });
  if (!user) {
    unauthorized('用户不存在');
    return;
  }

  await ensureDefaultRole();
  const featurePermissions = await getFeaturePermissions(
    (user.dataValues.role || UserRole.USER) as UserRole,
    user.dataValues.role_key
  );

  return {
    id: user.dataValues.id,
    email: user.dataValues.email,
    nickname: user.dataValues.nickname,
    avatar: user.dataValues.avatar,
    role: (user.dataValues.role || UserRole.USER) as UserRole,
    roleKey: user.dataValues.role_key,
    featurePermissions,
  };
};

export const getUserList: MyMiddleware = async ctx => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized('仅管理员可访问');
  }

  await ensureDefaultRole();
  const allRoles = await queryRoles();
  const featureMap = new Map<string, AppFeature[]>(
    allRoles.map(item => [item.dataValues.role_key, parseRoleFeatures(item.dataValues.features)])
  );

  const list = await queryUsers();
  return list.map(item => ({
    id: item.dataValues.id,
    email: item.dataValues.email,
    nickname: item.dataValues.nickname,
    avatar: item.dataValues.avatar,
    role: (item.dataValues.role || UserRole.USER) as UserRole,
    roleKey: item.dataValues.role_key,
    featurePermissions:
      item.dataValues.role === UserRole.ADMIN
        ? Object.values(AppFeature)
        : (featureMap.get(item.dataValues.role_key || DEFAULT_ROLE_KEY) || []),
  }));
};

export const setUserRole: MyMiddleware = async ctx => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized('仅管理员可操作');
  }

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
    nickname: targetUser.dataValues.nickname,
    avatar: targetUser.dataValues.avatar,
    role,
    roleKey: targetUser.dataValues.role_key,
    featurePermissions: await getFeaturePermissions(role as UserRole, targetUser.dataValues.role_key),
  };
};

export const updateCurrentUserProfile: MyMiddleware = async ctx => {
  const userId = ctx.state.userInfo?.id;
  if (!userId) {
    unauthorized('未登录');
  }

  const param = (ctx.request.body || {}) as UpdateUserProfilePayload;
  const nextProfile: UpdateUserProfilePayload = {};

  if (typeof param.nickname === 'string') {
    const nickname = param.nickname.trim();
    if (nickname.length > 32) {
      badRequest('昵称长度不能超过 32');
    }
    nextProfile.nickname = nickname;
  }

  if (typeof param.avatar === 'string') {
    const avatar = param.avatar.trim();
    if (avatar && !AVATAR_URL_REGEXP.test(avatar)) {
      badRequest('头像地址必须是 http/https 链接或 /file/ 开头的上传地址');
    }
    nextProfile.avatar = avatar;
  }

  if (Object.keys(nextProfile).length === 0) {
    badRequest('未提供可更新的字段');
  }

  await updateUser(userId as string | number, nextProfile);

  const updated = await queryUser({ id: userId as string | number });
  if (!updated) {
    badRequest('用户不存在');
    return;
  }

  return {
    id: updated.dataValues.id,
    email: updated.dataValues.email,
    nickname: updated.dataValues.nickname,
    avatar: updated.dataValues.avatar,
    role: (updated.dataValues.role || UserRole.USER) as UserRole,
    roleKey: updated.dataValues.role_key,
    featurePermissions: await getFeaturePermissions(
      (updated.dataValues.role || UserRole.USER) as UserRole,
      updated.dataValues.role_key
    ),
  };
};

export const getRoleList: MyMiddleware = async ctx => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized('仅管理员可访问');
  }

  await ensureDefaultRole();
  const roles = await queryRoles();
  return roles.map(item => ({
    roleKey: item.dataValues.role_key,
    roleName: item.dataValues.role_name,
    features: parseRoleFeatures(item.dataValues.features),
  }));
};

export const createRole: MyMiddleware = async ctx => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized('仅管理员可操作');
  }

  const param = (ctx.request.body || {}) as CreateRolePayload;
  const roleKeyInput = param.roleKey?.trim();
  const roleName = param.roleName?.trim();
  const features = normalizeRoleFeatures(param.features);

  if (!roleName) {
    badRequest('角色名称不能为空');
  }
  if (roleKeyInput && !/^[a-zA-Z][a-zA-Z0-9_-]{1,31}$/.test(roleKeyInput)) {
    badRequest('角色标识格式错误，需以字母开头，长度 2-32');
  }
  if (roleKeyInput === DEFAULT_ROLE_KEY) {
    badRequest('default 角色不可手动创建');
  }

  let roleKey = roleKeyInput || '';
  if (!roleKey) {
    // 自动生成 roleKey，避免让用户手动输入系统标识
    do {
      roleKey = buildAutoRoleKey();
    } while (await queryRole({ role_key: roleKey }));
  } else {
    const exists = await queryRole({ role_key: roleKey });
    if (exists) {
      badRequest('角色标识已存在');
    }
  }

  const role = await addRole({
    role_key: roleKey,
    role_name: roleName,
    features: stringifyRoleFeatures(features),
  });

  return {
    roleKey: role.dataValues.role_key,
    roleName: role.dataValues.role_name,
    features,
  };
};

export const updateRoleInfo: MyMiddleware = async ctx => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized('仅管理员可操作');
  }

  const roleKey = (ctx.params.roleKey || '').trim();
  const param = (ctx.request.body || {}) as UpdateRolePayload;
  if (!roleKey) {
    badRequest('roleKey 不能为空');
  }
  if (roleKey === DEFAULT_ROLE_KEY) {
    badRequest('default 角色不可修改');
  }

  const role = await queryRole({ role_key: roleKey });
  if (!role) {
    badRequest('角色不存在');
  }

  const nextData: { role_name?: string; features?: string } = {};
  if (typeof param.roleName === 'string') {
    const roleName = param.roleName.trim();
    if (!roleName) {
      badRequest('角色名称不能为空');
    }
    nextData.role_name = roleName;
  }
  if (param.features !== undefined) {
    const features = normalizeRoleFeatures(param.features);
    nextData.features = stringifyRoleFeatures(features);
  }
  if (Object.keys(nextData).length === 0) {
    badRequest('未提供可更新字段');
  }

  await updateRole(roleKey, nextData);
  const updated = await queryRole({ role_key: roleKey });
  if (!updated) {
    badRequest('角色不存在');
    return;
  }

  return {
    roleKey: updated.dataValues.role_key,
    roleName: updated.dataValues.role_name,
    features: parseRoleFeatures(updated.dataValues.features),
  };
};

export const removeRole: MyMiddleware = async ctx => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized('仅管理员可操作');
  }

  const roleKey = (ctx.params.roleKey || '').trim();
  if (!roleKey) {
    badRequest('roleKey 不能为空');
  }
  if (roleKey === DEFAULT_ROLE_KEY) {
    badRequest('default 角色不可删除');
  }

  const role = await queryRole({ role_key: roleKey });
  if (!role) {
    badRequest('角色不存在');
  }

  const userCount = await countUsersByRoleKey(roleKey);
  if (userCount > 0) {
    badRequest('该角色仍被用户使用，无法删除');
  }

  await deleteRole(roleKey);
  return {
    success: true,
  };
};

export const assignUserRole: MyMiddleware = async ctx => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized('仅管理员可操作');
  }

  const param = (ctx.request.body || {}) as AssignUserRolePayload;
  const { userId } = param;
  const roleKey = param.roleKey?.trim();
  if (!userId || !roleKey) {
    badRequest('参数错误');
  }

  const user = await queryUser({ id: userId });
  if (!user) {
    badRequest('用户不存在');
    return;
  }

  const role = await queryRole({ role_key: roleKey });
  if (!role) {
    badRequest('角色不存在');
    return;
  }

  await updateUser(userId, {
    role_key: roleKey,
  });

  const updated = await queryUser({ id: userId });
  if (!updated) {
    badRequest('用户不存在');
    return;
  }

  return toUserResponse(updated.dataValues);
};

export const getUserDetail: MyMiddleware = async ctx => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized('仅管理员可访问');
  }

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
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized('仅管理员可操作');
  }

  const param = (ctx.request.body || {}) as AdminCreateUserPayload;
  const email = param.email?.trim();
  const password = param.password?.trim();
  const nickname = typeof param.nickname === 'string' ? param.nickname.trim() : undefined;
  const avatar = typeof param.avatar === 'string' ? param.avatar.trim() : undefined;
  const role = (param.role || UserRole.USER) as UserRole;
  const roleKey = (param.roleKey || DEFAULT_ROLE_KEY).trim();

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

  await ensureDefaultRole();
  const roleObj = await queryRole({ role_key: roleKey });
  if (!roleObj) {
    badRequest('角色组不存在');
  }

  const exists = await queryUser({ email });
  if (exists) {
    badRequest('用户已存在');
  }

  const user = await addUser({
    email,
    password,
    nickname,
    avatar,
    role,
    role_key: roleKey,
  });

  return toUserResponse(user.dataValues);
};

export const adminUpdateUser: MyMiddleware = async ctx => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized('仅管理员可操作');
  }

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

  if (typeof param.roleKey === 'string') {
    const roleKey = param.roleKey.trim();
    if (!roleKey) {
      badRequest('角色组不能为空');
    }
    const roleObj = await queryRole({ role_key: roleKey });
    if (!roleObj) {
      badRequest('角色组不存在');
    }
    nextData.role_key = roleKey;
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
