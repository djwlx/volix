import type { WhereOptions } from 'sequelize';
import { Op } from 'sequelize';
import { UserModel } from '../model/user.model';
import { SystemSettingModel } from '../model/system-setting.model';
import { CreateUserParams, SystemSettingEntity, UserEntity } from '../types/user.types';

export const queryUser = async (param: WhereOptions<UserEntity>) => {
  return UserModel.findOne({ where: param });
};

export const addUser = async (param: CreateUserParams) => {
  return UserModel.create(param);
};

export const countUsers = async () => {
  return UserModel.count();
};

export const queryUsers = async () => {
  return UserModel.findAll({
    order: [['id', 'ASC']],
  });
};

export const updateUser = async (id: string | number, param: Partial<UserEntity>) => {
  return UserModel.update(param, {
    where: { id },
  });
};

export const querySystemSettingByKey = async (settingKey: string) => {
  return SystemSettingModel.findOne({
    where: {
      setting_key: settingKey,
    },
  });
};

export const querySystemSettingsByKeys = async (settingKeys: string[]) => {
  if (settingKeys.length === 0) {
    return [];
  }
  return SystemSettingModel.findAll({
    where: {
      setting_key: {
        [Op.in]: settingKeys,
      },
    },
  });
};

export const queryAllSystemSettings = async () => {
  return SystemSettingModel.findAll();
};

export const upsertSystemSetting = async (param: SystemSettingEntity) => {
  const existing = await querySystemSettingByKey(param.setting_key);
  if (existing) {
    await existing.update({
      setting_value: param.setting_value,
    });
    await existing.save();
    return existing;
  }
  return SystemSettingModel.create(param);
};

export const deleteSystemSettingsByKeys = async (settingKeys: string[]) => {
  if (settingKeys.length === 0) {
    return 0;
  }
  return SystemSettingModel.destroy({
    where: {
      setting_key: {
        [Op.in]: settingKeys,
      },
    },
  });
};
