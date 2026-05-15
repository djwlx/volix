import { log } from '../../../utils/logger';
import { getRequestActingUserId } from '../../../utils/request-context';
import { AppConfigEnum, ConfigType } from '../model/config.model';
import {
  deleteSystemSettingsByKeys,
  queryUser,
  queryAllSystemSettings,
  querySystemSettingByKey,
  querySystemSettingsByKeys,
  updateUser,
  upsertSystemSetting,
} from '../../user/service/user.service';

const USER_SCOPED_CONFIG_KEYS = new Set<string>([
  AppConfigEnum.cookie_115,
  AppConfigEnum.is_115_picture_caching,
  AppConfigEnum.picture_115_folders,
  AppConfigEnum.picture_115_random_weights,
]);

const USER_SCOPED_CONFIG_PREFIXES = ['picture_115_'];

const isUserScopedConfigKey = (key: string) => {
  if (USER_SCOPED_CONFIG_KEYS.has(key)) {
    return true;
  }
  return USER_SCOPED_CONFIG_PREFIXES.some(prefix => key.startsWith(prefix));
};

const toScopedConfigKey = (key: string) => {
  const actingUserId = getRequestActingUserId();
  if (!actingUserId || !isUserScopedConfigKey(key)) {
    return key;
  }
  return `${key}__user_${actingUserId}`;
};

const fromScopedConfigKey = (key: string) => {
  const splitIndex = key.indexOf('__user_');
  return splitIndex > 0 ? key.slice(0, splitIndex) : key;
};

type UserSettingsJson = Record<string, unknown>;

const parseUserSettingsJson = (raw?: string): UserSettingsJson => {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return parsed as UserSettingsJson;
  } catch {
    return {};
  }
};

const stringifyUserSettingsJson = (settings: UserSettingsJson) => {
  return JSON.stringify(settings || {});
};

const resolveActingUserSettingContext = async () => {
  const actingUserId = getRequestActingUserId();
  if (!actingUserId) {
    return null;
  }
  const user = await queryUser({ id: actingUserId });
  if (!user) {
    return null;
  }
  const userId = String(user.dataValues.id || actingUserId);
  const settings = parseUserSettingsJson(user.dataValues.settings_json);
  return {
    userId,
    settings,
  };
};

const getUserScopedConfigValue = async (key: string) => {
  const context = await resolveActingUserSettingContext();
  if (!context) {
    return '';
  }

  const currentValue = context.settings[key];
  if (typeof currentValue === 'string') {
    return currentValue;
  }
  if (currentValue !== undefined && currentValue !== null) {
    return String(currentValue);
  }

  // Backward compatibility: migrate legacy scoped keys from volix_system_setting.
  const legacyKey = toScopedConfigKey(key);
  const legacyRow = await querySystemSettingByKey(legacyKey);
  if (!legacyRow) {
    return '';
  }

  const legacyValue = String(legacyRow.dataValues.setting_value || '');
  context.settings[key] = legacyValue;
  await updateUser(context.userId, {
    settings_json: stringifyUserSettingsJson(context.settings),
  });
  await deleteSystemSettingsByKeys([legacyKey]);
  return legacyValue;
};

const setUserScopedConfigValue = async (key: string, value: string) => {
  const context = await resolveActingUserSettingContext();
  if (!context) {
    log.warn('[config] 缺少 acting user，降级写入系统配置', { key });
    await upsertSystemSetting({
      setting_key: key,
      setting_value: value,
    });
    return;
  }
  context.settings[key] = value;
  await updateUser(context.userId, {
    settings_json: stringifyUserSettingsJson(context.settings),
  });

  const legacyKey = toScopedConfigKey(key);
  if (legacyKey !== key) {
    await deleteSystemSettingsByKeys([legacyKey]);
  }
};

const clearUserScopedConfigValue = async (key: string) => {
  const context = await resolveActingUserSettingContext();
  if (!context) {
    return 0;
  }
  delete context.settings[key];
  await updateUser(context.userId, {
    settings_json: stringifyUserSettingsJson(context.settings),
  });

  const legacyKey = toScopedConfigKey(key);
  if (legacyKey !== key) {
    await deleteSystemSettingsByKeys([legacyKey]);
  }
  return 1;
};

export async function getConfig(key?: AppConfigEnum | AppConfigEnum[]) {
  try {
    if (!key) {
      const rows = await queryAllSystemSettings();
      const result: Partial<Record<AppConfigEnum, string>> = {};
      rows.forEach(item => {
        const baseKey = fromScopedConfigKey(String(item.dataValues.setting_key || '')) as AppConfigEnum;
        result[baseKey] = String(item.dataValues.setting_value || '');
      });

      const userSettingContext = await resolveActingUserSettingContext();
      if (userSettingContext) {
        Object.keys(userSettingContext.settings).forEach(settingKey => {
          if (!isUserScopedConfigKey(settingKey)) {
            return;
          }
          result[settingKey as AppConfigEnum] = String(userSettingContext.settings[settingKey] || '');
        });
      }
      return result;
    }

    if (Array.isArray(key)) {
      const result: Partial<Record<AppConfigEnum, string>> = {};
      const keyList = key.map(item => String(item));
      const userScopedKeys = keyList.filter(isUserScopedConfigKey);
      const systemScopedKeys = keyList.filter(item => !isUserScopedConfigKey(item));

      if (systemScopedKeys.length > 0) {
        const rows = await querySystemSettingsByKeys(systemScopedKeys);
        rows.forEach(item => {
          const baseKey = fromScopedConfigKey(String(item.dataValues.setting_key || '')) as AppConfigEnum;
          result[baseKey] = String(item.dataValues.setting_value || '');
        });
      }

      if (userScopedKeys.length > 0) {
        await Promise.all(
          userScopedKeys.map(async item => {
            result[item as AppConfigEnum] = await getUserScopedConfigValue(item);
          })
        );
      }
      return result;
    }

    const singleKey = String(key);
    if (isUserScopedConfigKey(singleKey)) {
      return {
        [singleKey]: await getUserScopedConfigValue(singleKey),
      } as Partial<Record<AppConfigEnum, string>>;
    }

    const row = await querySystemSettingByKey(singleKey);
    if (!row) {
      return {} as Partial<Record<AppConfigEnum, string>>;
    }
    return {
      [key]: String(row.dataValues.setting_value || ''),
    } as Partial<Record<AppConfigEnum, string>>;
  } catch (e) {
    log.error(e);
    return null;
  }
}

export async function setConfig(key: AppConfigEnum, configContent: string) {
  try {
    const normalizedKey = String(key);
    if (isUserScopedConfigKey(normalizedKey)) {
      await setUserScopedConfigValue(normalizedKey, configContent);
      const result: ConfigType = {
        config_name: key,
        config_content: configContent,
      };
      return result;
    }

    await upsertSystemSetting({
      setting_key: normalizedKey,
      setting_value: configContent,
    });

    const result: ConfigType = {
      config_name: key,
      config_content: configContent,
    };
    return result;
  } catch (e) {
    log.error(e);
  }
}

export async function clearConfig(key: AppConfigEnum | AppConfigEnum[]) {
  try {
    const keys = (Array.isArray(key) ? key : [key]).map(item => String(item));
    const userScopedKeys = keys.filter(isUserScopedConfigKey);
    const systemScopedKeys = keys.filter(item => !isUserScopedConfigKey(item));

    let deletedCount = 0;
    if (systemScopedKeys.length > 0) {
      deletedCount += await deleteSystemSettingsByKeys(systemScopedKeys);
    }
    if (userScopedKeys.length > 0) {
      const clearResults = await Promise.all(userScopedKeys.map(item => clearUserScopedConfigValue(item)));
      deletedCount += clearResults.map(item => Number(item || 0)).reduce((acc, item) => acc + item, 0);
    }
    return deletedCount;
  } catch (e) {
    log.error(e);
  }
}
