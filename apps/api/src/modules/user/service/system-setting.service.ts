import type { SystemConfigResponse, UpdateSystemConfigPayload } from '@volix/types';
import { t } from '../../../utils/i18n';
import { log } from '../../../utils/logger';
import { badRequest } from '../../shared/http-handler';
import { querySystemSettingByKey, queryUser, upsertSystemSetting } from './user.service';
import { normalizeSmtpAccountConfig, parseSmtpAccountConfig } from './user-config.service';
import {
  LOG_RETENTION_DAYS_DEFAULT,
  LOG_RETENTION_DAYS_KEY,
  LOG_RETENTION_DAYS_MAX,
  LOG_RETENTION_DAYS_MIN,
  RANDOM_PIC_DEFAULT_USER_ID_KEY,
  REGISTER_EMAIL_VERIFY_KEY,
  REGISTER_EMAIL_VERIFY_SMTP_KEY,
} from './system-setting.constants';

const parseBooleanSetting = (raw?: string) => {
  if (!raw) {
    return false;
  }
  return raw === 'true';
};

const parseRetentionDays = (raw?: string | null) => {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < LOG_RETENTION_DAYS_MIN || value > LOG_RETENTION_DAYS_MAX) {
    return LOG_RETENTION_DAYS_DEFAULT;
  }
  return value;
};

export async function getSystemConfigData(): Promise<SystemConfigResponse> {
  const [verifyEnabledRow, smtpRow, randomPicDefaultUserRow, logRetentionRow] = await Promise.all([
    querySystemSettingByKey(REGISTER_EMAIL_VERIFY_KEY),
    querySystemSettingByKey(REGISTER_EMAIL_VERIFY_SMTP_KEY),
    querySystemSettingByKey(RANDOM_PIC_DEFAULT_USER_ID_KEY),
    querySystemSettingByKey(LOG_RETENTION_DAYS_KEY),
  ]);

  const randomPicDefaultUserId = String(randomPicDefaultUserRow?.dataValues.setting_value || '').trim();
  return {
    registerEmailVerifyEnabled: parseBooleanSetting(verifyEnabledRow?.dataValues.setting_value),
    registerEmailVerifySmtp: parseSmtpAccountConfig(smtpRow?.dataValues.setting_value) || undefined,
    randomPicDefaultUserId: randomPicDefaultUserId || undefined,
    logRetentionDays: parseRetentionDays(logRetentionRow?.dataValues.setting_value),
  };
}

export async function updateSystemConfigData(payload: UpdateSystemConfigPayload): Promise<SystemConfigResponse> {
  if (typeof payload.registerEmailVerifyEnabled !== 'boolean') {
    badRequest(
      t({ id: 'setting.system.registerEmailVerify.invalid', defaultMessage: 'registerEmailVerifyEnabled 参数错误' })
    );
  }
  const hasLogRetentionInPayload = Object.prototype.hasOwnProperty.call(payload, 'logRetentionDays');
  if (hasLogRetentionInPayload) {
    const days = Number(payload.logRetentionDays);
    if (!Number.isInteger(days) || days < LOG_RETENTION_DAYS_MIN || days > LOG_RETENTION_DAYS_MAX) {
      badRequest(t({ id: 'setting.system.logRetention.invalid', defaultMessage: '日志保留天数必须为 1-365 的整数' }));
    }
  }
  const normalizedRandomPicDefaultUserId = String(payload.randomPicDefaultUserId || '').trim();
  const hasSmtpInPayload = Object.prototype.hasOwnProperty.call(payload, 'registerEmailVerifySmtp');
  const normalizedSmtp = payload.registerEmailVerifySmtp
    ? normalizeSmtpAccountConfig(payload.registerEmailVerifySmtp)
    : null;
  const currentSmtp = await getSystemRegisterSmtpConfig();
  const effectiveSmtp = normalizedSmtp || currentSmtp;

  if (payload.registerEmailVerifyEnabled && !effectiveSmtp) {
    badRequest(t({ id: 'setting.system.smtp.required', defaultMessage: '开启注册邮箱验证码后，必须配置 SMTP' }));
  }
  if (normalizedRandomPicDefaultUserId) {
    const user = await queryUser({ id: normalizedRandomPicDefaultUserId });
    if (!user) {
      badRequest(t({ id: 'setting.system.randomPicUser.notFound', defaultMessage: '随机图默认用户不存在' }));
    }
  }

  const updateTasks: Array<Promise<unknown>> = [
    upsertSystemSetting({
      setting_key: REGISTER_EMAIL_VERIFY_KEY,
      setting_value: String(payload.registerEmailVerifyEnabled),
    }),
    upsertSystemSetting({
      setting_key: RANDOM_PIC_DEFAULT_USER_ID_KEY,
      setting_value: normalizedRandomPicDefaultUserId,
    }),
  ];
  if (hasSmtpInPayload && normalizedSmtp) {
    updateTasks.push(
      upsertSystemSetting({
        setting_key: REGISTER_EMAIL_VERIFY_SMTP_KEY,
        setting_value: JSON.stringify(normalizedSmtp),
      })
    );
  }
  if (hasLogRetentionInPayload) {
    updateTasks.push(
      upsertSystemSetting({
        setting_key: LOG_RETENTION_DAYS_KEY,
        setting_value: String(Number(payload.logRetentionDays)),
      })
    );
  }
  await Promise.all(updateTasks);

  const logRetentionDays = hasLogRetentionInPayload ? Number(payload.logRetentionDays) : await getLogRetentionDays();

  log.info('系统配置已更新', {
    registerEmailVerifyEnabled: payload.registerEmailVerifyEnabled,
    smtpUpdated: hasSmtpInPayload && Boolean(normalizedSmtp),
    randomPicDefaultUserId: normalizedRandomPicDefaultUserId || undefined,
    logRetentionDays: hasLogRetentionInPayload ? logRetentionDays : undefined,
  });

  return {
    registerEmailVerifyEnabled: payload.registerEmailVerifyEnabled,
    registerEmailVerifySmtp: effectiveSmtp || undefined,
    randomPicDefaultUserId: normalizedRandomPicDefaultUserId || undefined,
    logRetentionDays,
  };
}

export async function getLogRetentionDays(): Promise<number> {
  try {
    const row = await querySystemSettingByKey(LOG_RETENTION_DAYS_KEY);
    return parseRetentionDays(row?.dataValues.setting_value);
  } catch {
    return LOG_RETENTION_DAYS_DEFAULT;
  }
}

export async function getSystemRegisterSmtpConfig() {
  const row = await querySystemSettingByKey(REGISTER_EMAIL_VERIFY_SMTP_KEY);
  return parseSmtpAccountConfig(row?.dataValues.setting_value) || null;
}

export async function getSystemRandomPicDefaultUserId() {
  const row = await querySystemSettingByKey(RANDOM_PIC_DEFAULT_USER_ID_KEY);
  const userId = String(row?.dataValues.setting_value || '').trim();
  return userId || '';
}
