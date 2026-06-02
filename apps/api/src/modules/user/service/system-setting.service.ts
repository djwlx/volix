import type { SystemConfigResponse, UpdateSystemConfigPayload } from '@volix/types';
import { t } from '../../../utils/i18n';
import { badRequest } from '../../shared/http-handler';
import { querySystemSettingByKey, queryUser, upsertSystemSetting } from './user.service';
import { normalizeSmtpAccountConfig, parseSmtpAccountConfig } from './user-config.service';
import {
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

export async function getSystemConfigData(): Promise<SystemConfigResponse> {
  const [verifyEnabledRow, smtpRow, randomPicDefaultUserRow] = await Promise.all([
    querySystemSettingByKey(REGISTER_EMAIL_VERIFY_KEY),
    querySystemSettingByKey(REGISTER_EMAIL_VERIFY_SMTP_KEY),
    querySystemSettingByKey(RANDOM_PIC_DEFAULT_USER_ID_KEY),
  ]);

  const randomPicDefaultUserId = String(randomPicDefaultUserRow?.dataValues.setting_value || '').trim();
  return {
    registerEmailVerifyEnabled: parseBooleanSetting(verifyEnabledRow?.dataValues.setting_value),
    registerEmailVerifySmtp: parseSmtpAccountConfig(smtpRow?.dataValues.setting_value) || undefined,
    randomPicDefaultUserId: randomPicDefaultUserId || undefined,
  };
}

export async function updateSystemConfigData(payload: UpdateSystemConfigPayload): Promise<SystemConfigResponse> {
  if (typeof payload.registerEmailVerifyEnabled !== 'boolean') {
    badRequest(
      t({ id: 'setting.system.registerEmailVerify.invalid', defaultMessage: 'registerEmailVerifyEnabled 参数错误' })
    );
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
  await Promise.all(updateTasks);

  return {
    registerEmailVerifyEnabled: payload.registerEmailVerifyEnabled,
    registerEmailVerifySmtp: effectiveSmtp || undefined,
    randomPicDefaultUserId: normalizedRandomPicDefaultUserId || undefined,
  };
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
