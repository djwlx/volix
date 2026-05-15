import { UserRole } from '@volix/types';
import type {
  LoginUserPayload,
  RegisterConfigResponse,
  RegisterUserPayload,
  SendRegisterCodePayload,
  SendRegisterCodeResponse,
  SmtpAccountConfigItem,
  UpdateUserProfilePayload,
  VerifyCurrentUserEmailPayload,
} from '@volix/types';
import jwt from '../../../utils/jwt';
import { badRequest, unauthorized } from '../../shared/http-handler';
import {
  assertRegisterCodeCanSend,
  generateRegisterVerifyCode,
  saveRegisterVerifyCode,
  sendRegisterCodeMail,
  verifyRegisterCode,
} from '../service/email.service';
import { addUser, countUsers, queryUser, updateUser } from '../service/user.service';
import { getSystemConfigData, getSystemRegisterSmtpConfig } from '../service/system-setting.service';
import {
  AVATAR_URL_REGEXP,
  EMAIL_REGEXP,
  getFeaturePermissions,
  parseUserSettingsJson,
  toUserResponse,
} from './shared';

const resolveRegisterSmtpConfig = async (): Promise<SmtpAccountConfigItem | null> => {
  return getSystemRegisterSmtpConfig();
};

const sendVerifyCodeEmail = async (params: { smtp: SmtpAccountConfigItem; email: string }) => {
  assertRegisterCodeCanSend(params.email);
  const code = generateRegisterVerifyCode();
  await sendRegisterCodeMail({
    smtpHost: params.smtp.host,
    smtpPort: params.smtp.port,
    smtpSecure: params.smtp.secure,
    smtpUsername: params.smtp.username,
    smtpPassword: params.smtp.password,
    fromEmail: params.smtp.fromEmail,
    toEmail: params.email,
    code,
  });
  saveRegisterVerifyCode(params.email, code);
};

export const loginUser: MyMiddleware = async ctx => {
  const param = ctx.request.body as LoginUserPayload;
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

  const [systemConfig, smtpConfig] = await Promise.all([getSystemConfigData(), resolveRegisterSmtpConfig()]);
  const shouldVerifyEmail = systemConfig.registerEmailVerifyEnabled && Boolean(smtpConfig);

  if (systemConfig.registerEmailVerifyEnabled && !smtpConfig) {
    badRequest('系统未配置可用 SMTP，暂时无法启用邮箱验证注册');
  }

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
    settings_json: '{}',
  });
  const featurePermissions = getFeaturePermissions((user.dataValues.role || role) as UserRole);

  return {
    id: user.dataValues.id,
    email: user.dataValues.email,
    emailVerified: Boolean(user.dataValues.email_verified),
    nickname: user.dataValues.nickname,
    avatar: user.dataValues.avatar,
    role: (user.dataValues.role || role) as UserRole,
    featurePermissions,
    settings: parseUserSettingsJson(user.dataValues.settings_json),
  };
};

export const getRegisterConfig: MyMiddleware = async () => {
  const [systemConfig, smtpConfig] = await Promise.all([getSystemConfigData(), resolveRegisterSmtpConfig()]);
  const result: RegisterConfigResponse = {
    emailVerificationRequired: systemConfig.registerEmailVerifyEnabled && Boolean(smtpConfig),
  };
  return result;
};

export const sendRegisterCode: MyMiddleware = async ctx => {
  const param = (ctx.request.body || {}) as SendRegisterCodePayload;
  const email = param.email?.trim();

  if (!email || !EMAIL_REGEXP.test(email)) {
    badRequest('邮箱格式错误');
  }

  const [systemConfig, smtpConfig] = await Promise.all([getSystemConfigData(), resolveRegisterSmtpConfig()]);
  if (!systemConfig.registerEmailVerifyEnabled) {
    badRequest('当前未开启注册邮箱验证');
  }
  if (!smtpConfig) {
    badRequest('系统未配置可用 SMTP');
    throw new Error('系统未配置可用 SMTP');
  }

  const exists = await queryUser({ email });
  if (exists) {
    badRequest('用户已存在');
  }

  await sendVerifyCodeEmail({
    smtp: smtpConfig,
    email,
  });

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

  const smtpConfig = await resolveRegisterSmtpConfig();
  if (!smtpConfig) {
    badRequest('系统未配置可用 SMTP');
    throw new Error('系统未配置可用 SMTP');
  }

  const email = user.email;
  await sendVerifyCodeEmail({
    smtp: smtpConfig,
    email,
  });

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

  const featurePermissions = getFeaturePermissions((user.dataValues.role || UserRole.USER) as UserRole);

  return {
    id: user.dataValues.id,
    email: user.dataValues.email,
    emailVerified: Boolean(user.dataValues.email_verified),
    nickname: user.dataValues.nickname,
    avatar: user.dataValues.avatar,
    role: (user.dataValues.role || UserRole.USER) as UserRole,
    featurePermissions,
    settings: parseUserSettingsJson(user.dataValues.settings_json),
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

  return toUserResponse(updated.dataValues);
};
