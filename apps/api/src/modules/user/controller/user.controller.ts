import { AccountConfigPlatform, UserRole } from '@volix/types';
import { AppFeature } from '@volix/types';
import type {
  AccountConfigMap,
  AiAccountConfigItem,
  AdminCreateUserPayload,
  AdminUpdateUserPayload,
  AssignUserRolePayload,
  CreateRolePayload,
  LoginUserPayload,
  ListAiModelsPayload,
  RegisterUserPayload,
  SendRegisterCodePayload,
  SendRegisterCodeResponse,
  SetUserRolePayload,
  SmtpAccountConfigItem,
  ServiceAccountConfigItem,
  TestAccountConfigPayload,
  UpdateAccountConfigPayload,
  UpdateRolePayload,
  UpdateSystemConfigPayload,
  UpdateUserProfilePayload,
  VerifyCurrentUserEmailPayload,
} from '@volix/types';
import jwt from '../../../utils/jwt';
import request from '../../../utils/request';
import { badRequest, unauthorized } from '../../shared/http-handler';
import { AppConfigEnum, getConfig, setConfig } from '../../config';
import { createOpenlistSdk, createQbittorrentSdk } from '../../../sdk';
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
import {
  assertRegisterCodeCanSend,
  generateRegisterVerifyCode,
  saveRegisterVerifyCode,
  sendRegisterCodeMail,
  verifyRegisterCode,
} from '../service/email.service';

const EMAIL_REGEXP = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AVATAR_URL_REGEXP = /^(https?:\/\/|\/file\/)/;
const DEFAULT_ROLE_KEY = 'default';
const ROLE_KEY_PREFIX = 'role';
const DEFAULT_USER_FEATURES: AppFeature[] = [AppFeature.RANDOM_PIC];
const ACCOUNT_CONFIG_KEY_MAP: Record<AccountConfigPlatform, AppConfigEnum> = {
  [AccountConfigPlatform.AI]: AppConfigEnum.account_ai,
  [AccountConfigPlatform.QBITTORRENT]: AppConfigEnum.account_qbittorrent,
  [AccountConfigPlatform.OPENLIST]: AppConfigEnum.account_openlist,
  [AccountConfigPlatform.SMTP]: AppConfigEnum.account_smtp,
};
const REGISTER_EMAIL_VERIFY_CONFIG_KEY = AppConfigEnum.register_email_verify_enabled;

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
    features: stringifyRoleFeatures(DEFAULT_USER_FEATURES),
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

const normalizeServiceAccountConfig = (config: unknown): ServiceAccountConfigItem => {
  if (!config || typeof config !== 'object') {
    badRequest('配置格式错误');
  }

  const raw = config as Partial<ServiceAccountConfigItem>;
  const baseUrl = typeof raw.baseUrl === 'string' ? raw.baseUrl.trim() : '';
  const username = typeof raw.username === 'string' ? raw.username.trim() : '';
  const password = typeof raw.password === 'string' ? raw.password.trim() : '';

  if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
    badRequest('baseUrl 必须是 http/https 地址');
  }
  if (!username) {
    badRequest('username 不能为空');
  }
  if (!password) {
    badRequest('password 不能为空');
  }

  return {
    baseUrl,
    username,
    password,
  };
};

const normalizeSmtpAccountConfig = (config: unknown): SmtpAccountConfigItem => {
  if (!config || typeof config !== 'object') {
    badRequest('SMTP 配置格式错误');
  }
  const raw = config as Partial<SmtpAccountConfigItem>;
  const host = typeof raw.host === 'string' ? raw.host.trim() : '';
  const port = typeof raw.port === 'number' ? raw.port : Number(raw.port);
  const secure = Boolean(raw.secure);
  const username = typeof raw.username === 'string' ? raw.username.trim() : '';
  const password = typeof raw.password === 'string' ? raw.password.trim() : '';
  const fromEmail = typeof raw.fromEmail === 'string' ? raw.fromEmail.trim() : '';

  if (!host) {
    badRequest('SMTP host 不能为空');
  }
  if (!Number.isFinite(port) || port <= 0 || port > 65535) {
    badRequest('SMTP port 非法');
  }
  if (!username) {
    badRequest('SMTP username 不能为空');
  }
  if (!password) {
    badRequest('SMTP password 不能为空');
  }
  if (!EMAIL_REGEXP.test(fromEmail)) {
    badRequest('SMTP 发件邮箱格式错误');
  }

  return {
    host,
    port,
    secure,
    username,
    password,
    fromEmail,
  };
};

const normalizeAiAccountConfig = (config: unknown): AiAccountConfigItem => {
  if (!config || typeof config !== 'object') {
    badRequest('AI 配置格式错误');
  }

  const raw = config as Partial<AiAccountConfigItem>;
  const baseUrl = typeof raw.baseUrl === 'string' ? raw.baseUrl.trim() : '';
  const apiKey = typeof raw.apiKey === 'string' ? raw.apiKey.trim() : '';
  const model = typeof raw.model === 'string' ? raw.model.trim() : '';

  if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
    badRequest('AI baseUrl 必须是 http/https 地址');
  }
  if (!apiKey) {
    badRequest('AI apiKey 不能为空');
  }
  if (!model) {
    badRequest('AI model 不能为空');
  }

  return {
    baseUrl,
    apiKey,
    model,
  };
};

const normalizeAiModelListConfig = (config: unknown): Pick<AiAccountConfigItem, 'baseUrl' | 'apiKey'> => {
  if (!config || typeof config !== 'object') {
    badRequest('AI 配置格式错误');
  }

  const raw = config as Partial<AiAccountConfigItem>;
  const baseUrl = typeof raw.baseUrl === 'string' ? raw.baseUrl.trim() : '';
  const apiKey = typeof raw.apiKey === 'string' ? raw.apiKey.trim() : '';

  if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
    badRequest('AI baseUrl 必须是 http/https 地址');
  }
  if (!apiKey) {
    badRequest('AI apiKey 不能为空');
  }

  return {
    baseUrl,
    apiKey,
  };
};

const parseServiceAccountConfig = (raw?: string): ServiceAccountConfigItem | null => {
  if (!raw) {
    return null;
  }
  try {
    return normalizeServiceAccountConfig(JSON.parse(raw));
  } catch {
    return null;
  }
};

const parseSmtpAccountConfig = (raw?: string): SmtpAccountConfigItem | null => {
  if (!raw) {
    return null;
  }
  try {
    return normalizeSmtpAccountConfig(JSON.parse(raw));
  } catch {
    return null;
  }
};

const parseAiAccountConfig = (raw?: string): AiAccountConfigItem | null => {
  if (!raw) {
    return null;
  }
  try {
    return normalizeAiAccountConfig(JSON.parse(raw));
  } catch {
    return null;
  }
};

const parseBooleanConfig = (raw?: string) => raw === 'true';

const buildAiModelsUrl = (baseUrl: string) => {
  const normalized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return normalized.endsWith('/models') ? normalized : `${normalized}/models`;
};

const buildAiChatCompletionsUrl = (baseUrl: string) => {
  const normalized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return normalized.endsWith('/chat/completions') ? normalized : `${normalized}/chat/completions`;
};

const getSystemConfigData = async () => {
  const config = await getConfig(REGISTER_EMAIL_VERIFY_CONFIG_KEY);
  return {
    registerEmailVerifyEnabled: parseBooleanConfig(config?.[REGISTER_EMAIL_VERIFY_CONFIG_KEY]),
  };
};

const toUserResponse = async (data: {
  id?: string | number;
  email?: string;
  email_verified?: boolean;
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
    emailVerified: Boolean(data.email_verified),
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
  const email = param.email?.trim();
  const password = param.password?.trim();
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

  const systemConfig = await getSystemConfigData();
  const smtpConfigData = await getConfig(AppConfigEnum.account_smtp);
  const smtpConfig = parseSmtpAccountConfig(smtpConfigData?.[AppConfigEnum.account_smtp]);
  const shouldVerifyEmail = systemConfig.registerEmailVerifyEnabled && Boolean(smtpConfig);

  if (shouldVerifyEmail) {
    const verifyCode = (param.verifyCode || '').trim();
    if (!verifyCode) {
      badRequest('请输入邮箱验证码');
    }
    const isValid = verifyRegisterCode(email, verifyCode);
    if (!isValid) {
      badRequest('验证码错误或已过期');
    }
  }

  const userCount = await countUsers();
  const role = userCount === 0 ? UserRole.ADMIN : UserRole.USER;

  const user = await addUser({
    email,
    email_verified: shouldVerifyEmail,
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
    emailVerified: Boolean(user.dataValues.email_verified),
    nickname: user.dataValues.nickname,
    avatar: user.dataValues.avatar,
    role: (user.dataValues.role || role) as UserRole,
    roleKey: user.dataValues.role_key,
    featurePermissions,
  };
};

export const getRegisterConfig: MyMiddleware = async () => {
  const [systemConfig, smtpConfigData] = await Promise.all([
    getSystemConfigData(),
    getConfig(AppConfigEnum.account_smtp),
  ]);
  const smtpConfig = parseSmtpAccountConfig(smtpConfigData?.[AppConfigEnum.account_smtp]);

  return {
    emailVerificationRequired: systemConfig.registerEmailVerifyEnabled && Boolean(smtpConfig),
  };
};

export const sendRegisterCode: MyMiddleware = async ctx => {
  const param = (ctx.request.body || {}) as SendRegisterCodePayload;
  const email = param.email?.trim();

  if (!email || !EMAIL_REGEXP.test(email)) {
    badRequest('邮箱格式错误');
  }

  const [systemConfig, smtpConfigData] = await Promise.all([
    getSystemConfigData(),
    getConfig(AppConfigEnum.account_smtp),
  ]);
  const smtpConfig = parseSmtpAccountConfig(smtpConfigData?.[AppConfigEnum.account_smtp]);

  if (!systemConfig.registerEmailVerifyEnabled) {
    badRequest('当前未开启注册邮箱验证');
  }
  if (!smtpConfig) {
    badRequest('请先在系统中配置 SMTP');
  }
  const smtp = smtpConfig as SmtpAccountConfigItem;

  const exists = await queryUser({ email });
  if (exists) {
    badRequest('用户已存在');
  }

  assertRegisterCodeCanSend(email);
  const code = generateRegisterVerifyCode();

  await sendRegisterCodeMail({
    smtpHost: smtp.host,
    smtpPort: smtp.port,
    smtpSecure: smtp.secure,
    smtpUsername: smtp.username,
    smtpPassword: smtp.password,
    fromEmail: smtp.fromEmail,
    toEmail: email,
    code,
  });
  saveRegisterVerifyCode(email, code);

  return {
    success: true,
  };
};

export const sendCurrentUserEmailVerifyCode: MyMiddleware = async ctx => {
  const userId = ctx.state.userInfo?.id;
  if (!userId) {
    unauthorized('未登录');
    return;
  }

  const userRecord = await queryUser({ id: userId as string | number });
  if (!userRecord) {
    unauthorized('用户不存在');
    return;
  }
  const user = userRecord.dataValues;
  if (user.email_verified) {
    badRequest('当前邮箱已完成验证');
  }

  const smtpConfigData = await getConfig(AppConfigEnum.account_smtp);
  const smtpConfig = parseSmtpAccountConfig(smtpConfigData?.[AppConfigEnum.account_smtp]);
  if (!smtpConfig) {
    badRequest('请先在系统中配置 SMTP');
  }

  const email = user.email;
  assertRegisterCodeCanSend(email);
  const code = generateRegisterVerifyCode();

  const smtp = smtpConfig as SmtpAccountConfigItem;
  await sendRegisterCodeMail({
    smtpHost: smtp.host,
    smtpPort: smtp.port,
    smtpSecure: smtp.secure,
    smtpUsername: smtp.username,
    smtpPassword: smtp.password,
    fromEmail: smtp.fromEmail,
    toEmail: email,
    code,
  });
  saveRegisterVerifyCode(email, code);

  const result: SendRegisterCodeResponse = {
    success: true,
  };
  return result;
};

export const verifyCurrentUserEmail: MyMiddleware = async ctx => {
  const userId = ctx.state.userInfo?.id;
  if (!userId) {
    unauthorized('未登录');
    return;
  }

  const userRecord = await queryUser({ id: userId as string | number });
  if (!userRecord) {
    unauthorized('用户不存在');
    return;
  }
  const user = userRecord.dataValues;
  if (user.email_verified) {
    badRequest('当前邮箱已完成验证');
  }

  const param = (ctx.request.body || {}) as VerifyCurrentUserEmailPayload;
  const verifyCode = (param.verifyCode || '').trim();
  if (!verifyCode) {
    badRequest('请输入邮箱验证码');
  }

  const isValid = verifyRegisterCode(user.email, verifyCode);
  if (!isValid) {
    badRequest('验证码错误或已过期');
  }

  await updateUser(userId as string | number, {
    email_verified: true,
  });

  const updatedRecord = await queryUser({ id: userId as string | number });
  if (!updatedRecord) {
    badRequest('用户不存在');
    return;
  }

  return toUserResponse(updatedRecord.dataValues);
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
    emailVerified: Boolean(user.dataValues.email_verified),
    nickname: user.dataValues.nickname,
    avatar: user.dataValues.avatar,
    role: (user.dataValues.role || UserRole.USER) as UserRole,
    roleKey: user.dataValues.role_key,
    featurePermissions,
  };
};

export const getAccountConfigs: MyMiddleware = async ctx => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized('仅管理员可访问');
  }

  const configData = await getConfig(Object.values(ACCOUNT_CONFIG_KEY_MAP));
  const result: AccountConfigMap = {};

  if (configData?.[AppConfigEnum.account_ai]) {
    result[AccountConfigPlatform.AI] = parseAiAccountConfig(configData[AppConfigEnum.account_ai]) || undefined;
  }
  if (configData?.[AppConfigEnum.account_qbittorrent]) {
    result[AccountConfigPlatform.QBITTORRENT] =
      parseServiceAccountConfig(configData[AppConfigEnum.account_qbittorrent]) || undefined;
  }
  if (configData?.[AppConfigEnum.account_openlist]) {
    result[AccountConfigPlatform.OPENLIST] =
      parseServiceAccountConfig(configData[AppConfigEnum.account_openlist]) || undefined;
  }
  if (configData?.[AppConfigEnum.account_smtp]) {
    result[AccountConfigPlatform.SMTP] = parseSmtpAccountConfig(configData[AppConfigEnum.account_smtp]) || undefined;
  }

  return result;
};

export const updateAccountConfig: MyMiddleware = async ctx => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized('仅管理员可操作');
  }

  const param = (ctx.request.body || {}) as UpdateAccountConfigPayload;
  const { platform } = param;

  if (!platform || !ACCOUNT_CONFIG_KEY_MAP[platform]) {
    badRequest('platform 参数错误');
  }

  const config =
    platform === AccountConfigPlatform.SMTP
      ? normalizeSmtpAccountConfig(param.config)
      : platform === AccountConfigPlatform.AI
      ? normalizeAiAccountConfig(param.config)
      : normalizeServiceAccountConfig(param.config);
  const configKey = ACCOUNT_CONFIG_KEY_MAP[platform];
  await setConfig(configKey, JSON.stringify(config));

  return {
    platform,
    config,
  };
};

export const testAccountConfig: MyMiddleware = async ctx => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized('仅管理员可操作');
  }

  const param = (ctx.request.body || {}) as TestAccountConfigPayload;
  const { platform } = param;

  try {
    if (platform === AccountConfigPlatform.AI) {
      const config = normalizeAiAccountConfig(param.config);

      await request.post(
        buildAiChatCompletionsUrl(config.baseUrl),
        {
          model: config.model,
          temperature: 0,
          max_tokens: 1,
          messages: [
            {
              role: 'user',
              content: 'ping',
            },
          ],
        },
        {
          timeout: 10000,
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        message: `联通成功，模型 ${config.model} 可用`,
      };
    }

    if (platform === AccountConfigPlatform.QBITTORRENT) {
      const config = normalizeServiceAccountConfig(param.config);
      const sdk = createQbittorrentSdk({
        apiHost: config.baseUrl,
        username: config.username,
        password: config.password,
      });

      await sdk.getTorrentList();

      return {
        success: true,
        message: 'qBittorrent 联通成功',
      };
    }

    if (platform === AccountConfigPlatform.OPENLIST) {
      const config = normalizeServiceAccountConfig(param.config);
      const sdk = createOpenlistSdk({
        apiHost: config.baseUrl,
      });

      await sdk.loginWithHashedPassword(config.username, config.password);
      const me = await sdk.getMe();

      return {
        success: true,
        message: `OpenList 联通成功，当前账号：${me.username}`,
      };
    }

    badRequest('当前平台暂不支持联通性测试');
  } catch (error) {
    const message =
      (error as { response?: { data?: { error?: { message?: string }; message?: string } }; message?: string })
        ?.response?.data?.error?.message ||
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      (error as Error)?.message ||
      '联通失败';

    const platformLabelMap: Record<AccountConfigPlatform, string> = {
      [AccountConfigPlatform.AI]: 'AI 服务',
      [AccountConfigPlatform.QBITTORRENT]: 'qBittorrent',
      [AccountConfigPlatform.OPENLIST]: 'OpenList',
      [AccountConfigPlatform.SMTP]: 'SMTP',
    };

    badRequest(`${platformLabelMap[platform] || '服务'}联通失败: ${message}`);
  }
};

export const getAiModelList: MyMiddleware = async ctx => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized('仅管理员可操作');
  }

  const param = (ctx.request.body || {}) as ListAiModelsPayload;
  const config = normalizeAiModelListConfig(param);

  try {
    const response = await request.get(buildAiModelsUrl(config.baseUrl), {
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    const models = Array.isArray(response.data?.data)
      ? response.data.data
          .map((item: { id?: string }) => String(item?.id || '').trim())
          .filter(Boolean)
          .sort((a: string, b: string) => a.localeCompare(b))
      : [];

    return {
      models,
    };
  } catch (error) {
    const message =
      (error as { response?: { data?: { error?: { message?: string }; message?: string } } })?.response?.data?.error
        ?.message ||
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      (error as Error)?.message ||
      '获取模型列表失败';

    badRequest(`获取模型列表失败: ${message}`);
  }
};

export const getSystemConfig: MyMiddleware = async ctx => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized('仅管理员可访问');
  }
  return getSystemConfigData();
};

export const updateSystemConfig: MyMiddleware = async ctx => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized('仅管理员可操作');
  }

  const param = (ctx.request.body || {}) as UpdateSystemConfigPayload;
  if (typeof param.registerEmailVerifyEnabled !== 'boolean') {
    badRequest('registerEmailVerifyEnabled 参数错误');
  }

  await setConfig(REGISTER_EMAIL_VERIFY_CONFIG_KEY, String(param.registerEmailVerifyEnabled));
  return {
    registerEmailVerifyEnabled: param.registerEmailVerifyEnabled,
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
    emailVerified: Boolean(item.dataValues.email_verified),
    nickname: item.dataValues.nickname,
    avatar: item.dataValues.avatar,
    role: (item.dataValues.role || UserRole.USER) as UserRole,
    roleKey: item.dataValues.role_key,
    featurePermissions:
      item.dataValues.role === UserRole.ADMIN
        ? Object.values(AppFeature)
        : featureMap.get(item.dataValues.role_key || DEFAULT_ROLE_KEY) || [],
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
    emailVerified: Boolean(targetUser.dataValues.email_verified),
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
    emailVerified: Boolean(updated.dataValues.email_verified),
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
    email_verified: false,
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
