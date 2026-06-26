import crypto from 'crypto';
import { t } from '../../../utils/i18n';
import { badRequest } from '../../shared/http-handler';

interface SendRegisterCodeMailParams {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  toEmail: string;
  code: string;
}

interface SendResetPasswordMailParams extends SendRegisterCodeMailParams {
  resetLink: string;
}

interface SendSmtpMailParams {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  text: string;
  html?: string;
}

interface VerifySmtpConnectionParams {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUsername: string;
  smtpPassword: string;
}

type RegisterCodeCacheValue = {
  code: string;
  expiresAt: number;
  sendAt: number;
};

type ResetPasswordTokenCacheValue = {
  email: string;
  expiresAt: number;
};

const REGISTER_CODE_TTL_MS = 5 * 60 * 1000;
const REGISTER_CODE_SEND_INTERVAL_MS = 60 * 1000;
const registerCodeCache = new Map<string, RegisterCodeCacheValue>();
const resetPasswordCodeCache = new Map<string, RegisterCodeCacheValue>();
const resetPasswordTokenCache = new Map<string, ResetPasswordTokenCacheValue>();

const now = () => Date.now();

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const normalizeToken = (token: string) => token.trim();

const getCodeCache = (cacheMap: Map<string, RegisterCodeCacheValue>, email: string) => {
  const key = normalizeEmail(email);
  const cache = cacheMap.get(key);
  if (!cache) {
    return null;
  }
  if (cache.expiresAt <= now()) {
    cacheMap.delete(key);
    return null;
  }
  return cache;
};

const saveCodeCache = (cacheMap: Map<string, RegisterCodeCacheValue>, email: string, code: string) => {
  const key = normalizeEmail(email);
  cacheMap.set(key, {
    code,
    expiresAt: now() + REGISTER_CODE_TTL_MS,
    sendAt: now(),
  });
};

const canSendCode = (cacheMap: Map<string, RegisterCodeCacheValue>, email: string) => {
  const cache = getCodeCache(cacheMap, email);
  if (!cache) {
    return true;
  }
  return now() - cache.sendAt >= REGISTER_CODE_SEND_INTERVAL_MS;
};

const verifyCode = (cacheMap: Map<string, RegisterCodeCacheValue>, email: string, code: string) => {
  const key = normalizeEmail(email);
  const cache = getCodeCache(cacheMap, email);
  if (!cache) {
    return false;
  }
  const isValid = cache.code === code.trim();
  if (isValid) {
    cacheMap.delete(key);
  }
  return isValid;
};

export const generateRegisterVerifyCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const saveRegisterVerifyCode = (email: string, code: string) => {
  saveCodeCache(registerCodeCache, email, code);
};

export const canSendRegisterVerifyCode = (email: string) => {
  return canSendCode(registerCodeCache, email);
};

export const verifyRegisterCode = (email: string, code: string) => {
  return verifyCode(registerCodeCache, email, code);
};

export const saveResetPasswordVerifyCode = (email: string, code: string) => {
  saveCodeCache(resetPasswordCodeCache, email, code);
};

export const canSendResetPasswordVerifyCode = (email: string) => {
  return canSendCode(resetPasswordCodeCache, email);
};

export const verifyResetPasswordCode = (email: string, code: string) => {
  return verifyCode(resetPasswordCodeCache, email, code);
};

export const generateResetPasswordToken = () => {
  return crypto.randomBytes(24).toString('hex');
};

export const saveResetPasswordToken = (email: string, token: string) => {
  resetPasswordTokenCache.set(normalizeToken(token), {
    email: normalizeEmail(email),
    expiresAt: now() + REGISTER_CODE_TTL_MS,
  });
};

export const consumeResetPasswordToken = (token: string) => {
  const key = normalizeToken(token);
  const cache = resetPasswordTokenCache.get(key);
  if (!cache) {
    return null;
  }
  if (cache.expiresAt <= now()) {
    resetPasswordTokenCache.delete(key);
    return null;
  }
  resetPasswordTokenCache.delete(key);
  return cache.email;
};

export const sendRegisterCodeMail = async (params: SendRegisterCodeMailParams) => {
  await sendSmtpMail({
    smtpHost: params.smtpHost,
    smtpPort: params.smtpPort,
    smtpSecure: params.smtpSecure,
    smtpUsername: params.smtpUsername,
    smtpPassword: params.smtpPassword,
    fromEmail: params.fromEmail,
    toEmail: params.toEmail,
    subject: t({ id: 'auth.mail.register.subject', defaultMessage: 'Volix 注册验证码' }),
    text: t(
      { id: 'auth.mail.register.text', defaultMessage: '你的注册验证码是 {{code}}，5 分钟内有效。' },
      { code: params.code }
    ),
    html: `<p>${t(
      { id: 'auth.mail.register.html', defaultMessage: '你的注册验证码是 <b>{{code}}</b>，5 分钟内有效。' },
      { code: params.code }
    )}</p>`,
  });
};

export const sendResetPasswordMail = async (params: SendResetPasswordMailParams) => {
  await sendSmtpMail({
    smtpHost: params.smtpHost,
    smtpPort: params.smtpPort,
    smtpSecure: params.smtpSecure,
    smtpUsername: params.smtpUsername,
    smtpPassword: params.smtpPassword,
    fromEmail: params.fromEmail,
    toEmail: params.toEmail,
    subject: t({ id: 'auth.mail.reset.subject', defaultMessage: 'Volix 重置密码' }),
    text: t(
      {
        id: 'auth.mail.reset.text',
        defaultMessage: '你的重置验证码是 {{code}}，5 分钟内有效。也可以直接打开这个链接重置密码：{{resetLink}}',
      },
      { code: params.code, resetLink: params.resetLink }
    ),
    html: [
      `<p>${t(
        { id: 'auth.mail.reset.code', defaultMessage: '你的重置验证码是 <b>{{code}}</b>，5 分钟内有效。' },
        { code: params.code }
      )}</p>`,
      `<p>${t({ id: 'auth.mail.reset.linkLabel', defaultMessage: '也可以直接点击下面的链接重置密码：' })}</p>`,
      `<p><a href="${params.resetLink}">${params.resetLink}</a></p>`,
    ].join(''),
  });
};

export const sendSmtpMail = async (params: SendSmtpMailParams) => {
  const nodemailer = require('nodemailer') as {
    createTransport: (options: unknown) => {
      sendMail: (mailOptions: unknown) => Promise<unknown>;
    };
  };
  const transporter = nodemailer.createTransport({
    host: params.smtpHost,
    port: params.smtpPort,
    secure: params.smtpSecure,
    auth: {
      user: params.smtpUsername,
      pass: params.smtpPassword,
    },
  });

  await transporter.sendMail({
    from: params.fromEmail,
    to: params.toEmail,
    subject: params.subject,
    text: params.text,
    html: params.html || `<p>${params.text}</p>`,
  });
};

export const verifySmtpConnection = async (params: VerifySmtpConnectionParams) => {
  const nodemailer = require('nodemailer') as {
    createTransport: (options: unknown) => {
      verify: () => Promise<unknown>;
    };
  };
  const transporter = nodemailer.createTransport({
    host: params.smtpHost,
    port: params.smtpPort,
    secure: params.smtpSecure,
    auth: {
      user: params.smtpUsername,
      pass: params.smtpPassword,
    },
  });

  await transporter.verify();
};

export const assertRegisterCodeCanSend = (email: string) => {
  if (!canSendRegisterVerifyCode(email)) {
    badRequest(t({ id: 'auth.verifyCode.tooFrequent', defaultMessage: '验证码发送过于频繁，请稍后再试' }));
  }
};

export const assertResetPasswordCodeCanSend = (email: string) => {
  if (!canSendResetPasswordVerifyCode(email)) {
    badRequest(t({ id: 'auth.verifyCode.tooFrequent', defaultMessage: '验证码发送过于频繁，请稍后再试' }));
  }
};
