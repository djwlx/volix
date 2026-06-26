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
import { t } from '../../../utils/i18n';
import { log } from '../../../utils/logger';
import jwt from '../../../utils/jwt';
import { hashPassword, isHashedPassword, verifyPassword } from '../../../utils/password';
import { badRequest, unauthorized } from '../../shared/http-handler';
import {
  assertRegisterCodeCanSend,
  assertResetPasswordCodeCanSend,
  consumeResetPasswordToken,
  generateRegisterVerifyCode,
  generateResetPasswordToken,
  saveRegisterVerifyCode,
  saveResetPasswordToken,
  saveResetPasswordVerifyCode,
  sendRegisterCodeMail,
  sendResetPasswordMail,
  verifyResetPasswordCode,
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

type SendForgotPasswordCodePayload = {
  email: string;
};

type ResetPasswordPayload = {
  email?: string;
  verifyCode?: string;
  token?: string;
  newPassword: string;
};

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
  log.info('已发送邮箱验证码', { email: params.email });
};

const buildResetPasswordLink = (ctx: Parameters<MyMiddleware>[0], email: string, token: string) => {
  const baseUrl = ctx.origin || 'http://localhost:3000';
  const query = new URLSearchParams({
    mode: 'reset',
    token,
    email,
  });
  return `${baseUrl}/auth?${query.toString()}`;
};

export const loginUser: MyMiddleware = async ctx => {
  const param = ctx.request.body as LoginUserPayload;
  const email = param.email?.trim();
  const password = param.password?.trim();
  if (!email || !password) {
    badRequest(t({ id: 'auth.validation.emailOrPasswordRequired', defaultMessage: '邮箱或密码不能为空' }));
  }
  if (!EMAIL_REGEXP.test(email)) {
    badRequest(t({ id: 'auth.validation.invalidEmail', defaultMessage: '邮箱格式错误' }));
  }

  const findOne = await queryUser({ email });
  if (!findOne) {
    log.warn('用户登录失败：凭证错误', { email });
    badRequest(t({ id: 'auth.login.invalidCredentials', defaultMessage: '邮箱或密码错误' }));
  }

  const storedPassword = findOne?.dataValues?.password;
  const passwordMatches = await verifyPassword(password, storedPassword);
  if (!passwordMatches) {
    log.warn('用户登录失败：凭证错误', { email });
    badRequest(t({ id: 'auth.login.invalidCredentials', defaultMessage: '邮箱或密码错误' }));
  }

  const userId = findOne?.dataValues?.id;
  if (userId === undefined || userId === null) {
    badRequest(t({ id: 'auth.user.invalid', defaultMessage: '用户信息异常' }));
  }

  // 历史明文密码在校验通过后自动升级为哈希存储
  if (!isHashedPassword(storedPassword)) {
    try {
      await updateUser(userId as string | number, { password: await hashPassword(password) });
    } catch (e) {
      log.warn('密码哈希升级失败', { userId, error: e });
    }
  }

  log.info('用户登录成功', { userId, email });
  return {
    token: jwt.setToken({ id: userId as string | number }),
  };
};

export const registerUser: MyMiddleware = async ctx => {
  const param = ctx.request.body as RegisterUserPayload;
  const email = param.email?.trim();
  const password = param.password?.trim();
  if (!email || !password) {
    badRequest(t({ id: 'auth.validation.emailOrPasswordRequired', defaultMessage: '邮箱或密码不能为空' }));
  }
  if (!EMAIL_REGEXP.test(email)) {
    badRequest(t({ id: 'auth.validation.invalidEmail', defaultMessage: '邮箱格式错误' }));
  }

  const findOne = await queryUser({
    email,
  });
  if (findOne) {
    badRequest(t({ id: 'auth.user.exists', defaultMessage: '用户已存在' }));
  }

  const [systemConfig, smtpConfig] = await Promise.all([getSystemConfigData(), resolveRegisterSmtpConfig()]);
  const shouldVerifyEmail = systemConfig.registerEmailVerifyEnabled && Boolean(smtpConfig);

  if (systemConfig.registerEmailVerifyEnabled && !smtpConfig) {
    badRequest(
      t({ id: 'auth.register.smtpUnavailable', defaultMessage: '系统未配置可用 SMTP，暂时无法启用邮箱验证注册' })
    );
  }

  if (shouldVerifyEmail) {
    const verifyCode = (param.verifyCode || '').trim();
    if (!verifyCode) {
      badRequest(t({ id: 'auth.verifyCode.required', defaultMessage: '请输入邮箱验证码' }));
    }
    const isValid = verifyRegisterCode(email, verifyCode);
    if (!isValid) {
      badRequest(t({ id: 'auth.verifyCode.invalid', defaultMessage: '验证码错误或已过期' }));
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
  log.info('新用户注册成功', { userId: user.dataValues.id, email, role, emailVerified: shouldVerifyEmail });
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
    badRequest(t({ id: 'auth.validation.invalidEmail', defaultMessage: '邮箱格式错误' }));
  }

  const [systemConfig, smtpConfig] = await Promise.all([getSystemConfigData(), resolveRegisterSmtpConfig()]);
  if (!systemConfig.registerEmailVerifyEnabled) {
    badRequest(t({ id: 'auth.register.verifyDisabled', defaultMessage: '当前未开启注册邮箱验证' }));
  }
  if (!smtpConfig) {
    badRequest(t({ id: 'auth.register.smtpMissing', defaultMessage: '系统未配置可用 SMTP' }));
    throw new Error(t({ id: 'auth.register.smtpMissing', defaultMessage: '系统未配置可用 SMTP' }));
  }

  const exists = await queryUser({ email });
  if (exists) {
    badRequest(t({ id: 'auth.user.exists', defaultMessage: '用户已存在' }));
  }

  await sendVerifyCodeEmail({
    smtp: smtpConfig,
    email,
  });

  return {
    success: true,
  };
};

export const sendForgotPasswordCode: MyMiddleware = async ctx => {
  const param = (ctx.request.body || {}) as SendForgotPasswordCodePayload;
  const email = param.email?.trim().toLowerCase();

  if (!email || !EMAIL_REGEXP.test(email)) {
    badRequest(t({ id: 'auth.validation.invalidEmail', defaultMessage: '邮箱格式错误' }));
  }

  const smtpConfig = await resolveRegisterSmtpConfig();
  if (!smtpConfig) {
    badRequest(t({ id: 'auth.register.smtpMissing', defaultMessage: '系统未配置可用 SMTP' }));
    return;
  }

  const user = await queryUser({ email });
  if (!user) {
    log.warn('忘记密码请求用户不存在', { email });
    return {
      success: true,
    };
  }

  assertResetPasswordCodeCanSend(email);
  const code = generateRegisterVerifyCode();
  const token = generateResetPasswordToken();
  const resetLink = buildResetPasswordLink(ctx, email, token);

  await sendResetPasswordMail({
    smtpHost: smtpConfig.host,
    smtpPort: smtpConfig.port,
    smtpSecure: smtpConfig.secure,
    smtpUsername: smtpConfig.username,
    smtpPassword: smtpConfig.password,
    fromEmail: smtpConfig.fromEmail,
    toEmail: email,
    code,
    resetLink,
  });

  saveResetPasswordVerifyCode(email, code);
  saveResetPasswordToken(email, token);
  log.info('已发送重置密码邮件', { email, userId: user.dataValues.id });

  return {
    success: true,
  };
};

export const resetPassword: MyMiddleware = async ctx => {
  const param = (ctx.request.body || {}) as ResetPasswordPayload;
  const newPassword = param.newPassword?.trim();
  if (!newPassword) {
    badRequest(t({ id: 'auth.password.required', defaultMessage: '请输入密码' }));
  }
  if (newPassword.length < 6) {
    badRequest(t({ id: 'auth.password.min', defaultMessage: '密码至少 6 位' }));
  }

  let email = param.email?.trim().toLowerCase();
  if (param.token?.trim()) {
    email = consumeResetPasswordToken(param.token.trim()) || undefined;
    if (!email) {
      badRequest(t({ id: 'auth.reset.tokenInvalid', defaultMessage: '重置链接无效或已过期' }));
    }
  } else {
    if (!email || !EMAIL_REGEXP.test(email)) {
      badRequest(t({ id: 'auth.validation.invalidEmail', defaultMessage: '邮箱格式错误' }));
      return;
    }
    const verifyCode = param.verifyCode?.trim();
    if (!verifyCode) {
      badRequest(t({ id: 'auth.verifyCode.required', defaultMessage: '请输入邮箱验证码' }));
      return;
    }
    if (!verifyResetPasswordCode(email, verifyCode)) {
      badRequest(t({ id: 'auth.verifyCode.invalid', defaultMessage: '验证码错误或已过期' }));
    }
  }

  const user = await queryUser({ email });
  if (!user) {
    badRequest(t({ id: 'auth.user.notFound', defaultMessage: '用户不存在' }));
    return;
  }
  const userId = user.dataValues.id;
  if (userId === undefined || userId === null) {
    badRequest(t({ id: 'auth.user.invalid', defaultMessage: '用户信息异常' }));
    return;
  }

  await updateUser(userId, {
    password: await hashPassword(newPassword),
  });
  log.info('用户重置密码成功', { userId, email });

  return {
    success: true,
  };
};

export const sendCurrentUserEmailVerifyCode: MyMiddleware = async ctx => {
  const userId = ctx.state.userInfo?.id;
  if (!userId) {
    unauthorized(t({ id: 'auth.unauthorized', defaultMessage: '未登录' }));
    return;
  }

  const userRecord = await queryUser({ id: userId as string | number });
  if (!userRecord) {
    unauthorized(t({ id: 'auth.user.notFound', defaultMessage: '用户不存在' }));
    return;
  }
  const user = userRecord.dataValues;
  if (user.email_verified) {
    badRequest(t({ id: 'auth.email.alreadyVerified', defaultMessage: '当前邮箱已完成验证' }));
  }

  const smtpConfig = await resolveRegisterSmtpConfig();
  if (!smtpConfig) {
    badRequest(t({ id: 'auth.register.smtpMissing', defaultMessage: '系统未配置可用 SMTP' }));
    throw new Error(t({ id: 'auth.register.smtpMissing', defaultMessage: '系统未配置可用 SMTP' }));
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
    unauthorized(t({ id: 'auth.unauthorized', defaultMessage: '未登录' }));
    return;
  }

  const userRecord = await queryUser({ id: userId as string | number });
  if (!userRecord) {
    unauthorized(t({ id: 'auth.user.notFound', defaultMessage: '用户不存在' }));
    return;
  }
  const user = userRecord.dataValues;
  if (user.email_verified) {
    badRequest(t({ id: 'auth.email.alreadyVerified', defaultMessage: '当前邮箱已完成验证' }));
  }

  const param = (ctx.request.body || {}) as VerifyCurrentUserEmailPayload;
  const verifyCode = (param.verifyCode || '').trim();
  if (!verifyCode) {
    badRequest(t({ id: 'auth.verifyCode.required', defaultMessage: '请输入邮箱验证码' }));
  }

  const isValid = verifyRegisterCode(user.email, verifyCode);
  if (!isValid) {
    badRequest(t({ id: 'auth.verifyCode.invalid', defaultMessage: '验证码错误或已过期' }));
  }

  await updateUser(userId as string | number, {
    email_verified: true,
  });
  log.info('用户邮箱验证成功', { userId, email: user.email });

  const updatedRecord = await queryUser({ id: userId as string | number });
  if (!updatedRecord) {
    badRequest(t({ id: 'auth.user.notFound', defaultMessage: '用户不存在' }));
    return;
  }

  return toUserResponse(updatedRecord.dataValues);
};

export const getCurrentUser: MyMiddleware = async ctx => {
  const userId = ctx.state.userInfo?.id;
  if (!userId) {
    unauthorized(t({ id: 'auth.unauthorized', defaultMessage: '未登录' }));
  }

  const user = await queryUser({ id: userId as string | number });
  if (!user) {
    unauthorized(t({ id: 'auth.user.notFound', defaultMessage: '用户不存在' }));
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
    unauthorized(t({ id: 'auth.unauthorized', defaultMessage: '未登录' }));
  }

  const param = (ctx.request.body || {}) as UpdateUserProfilePayload;
  const nextProfile: UpdateUserProfilePayload = {};

  if (typeof param.nickname === 'string') {
    const nickname = param.nickname.trim();
    if (nickname.length > 32) {
      badRequest(t({ id: 'user.nickname.maxLength', defaultMessage: '昵称长度不能超过 32' }));
    }
    nextProfile.nickname = nickname;
  }

  if (typeof param.avatar === 'string') {
    const avatar = param.avatar.trim();
    if (avatar && !AVATAR_URL_REGEXP.test(avatar)) {
      badRequest(
        t({ id: 'user.avatar.invalid', defaultMessage: '头像地址必须是 http/https 链接或 /file/ 开头的上传地址' })
      );
    }
    nextProfile.avatar = avatar;
  }

  if (Object.keys(nextProfile).length === 0) {
    badRequest(t({ id: 'common.validation.noFieldsToUpdate', defaultMessage: '未提供可更新的字段' }));
  }

  await updateUser(userId as string | number, nextProfile);
  log.info('用户更新个人资料', { userId, fields: Object.keys(nextProfile) });

  const updated = await queryUser({ id: userId as string | number });
  if (!updated) {
    badRequest(t({ id: 'auth.user.notFound', defaultMessage: '用户不存在' }));
    return;
  }

  return toUserResponse(updated.dataValues);
};
