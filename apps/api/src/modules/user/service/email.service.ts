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

const REGISTER_CODE_TTL_MS = 5 * 60 * 1000;
const REGISTER_CODE_SEND_INTERVAL_MS = 60 * 1000;
const registerCodeCache = new Map<string, RegisterCodeCacheValue>();

const now = () => Date.now();

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getRegisterCodeCache = (email: string) => {
  const cache = registerCodeCache.get(normalizeEmail(email));
  if (!cache) {
    return null;
  }
  if (cache.expiresAt <= now()) {
    registerCodeCache.delete(normalizeEmail(email));
    return null;
  }
  return cache;
};

export const generateRegisterVerifyCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const saveRegisterVerifyCode = (email: string, code: string) => {
  const key = normalizeEmail(email);
  registerCodeCache.set(key, {
    code,
    expiresAt: now() + REGISTER_CODE_TTL_MS,
    sendAt: now(),
  });
};

export const canSendRegisterVerifyCode = (email: string) => {
  const cache = getRegisterCodeCache(email);
  if (!cache) {
    return true;
  }
  return now() - cache.sendAt >= REGISTER_CODE_SEND_INTERVAL_MS;
};

export const verifyRegisterCode = (email: string, code: string) => {
  const cache = getRegisterCodeCache(email);
  if (!cache) {
    return false;
  }
  const isValid = cache.code === code.trim();
  if (isValid) {
    registerCodeCache.delete(normalizeEmail(email));
  }
  return isValid;
};

export const sendRegisterCodeMail = async (params: SendRegisterCodeMailParams) => {
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
    subject: 'Volix 注册验证码',
    text: `你的注册验证码是 ${params.code}，5 分钟内有效。`,
    html: `<p>你的注册验证码是 <b>${params.code}</b>，5 分钟内有效。</p>`,
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
    badRequest('验证码发送过于频繁，请稍后再试');
  }
};
