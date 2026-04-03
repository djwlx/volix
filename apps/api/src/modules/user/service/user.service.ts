import type { WhereOptions } from 'sequelize';
import { Op } from 'sequelize';
import { UserModel } from '../model/user.model';
import { RoleModel } from '../model/role.model';
import { AppFeature } from '@volix/types';
import { CreateRoleParams, CreateUserParams, RoleEntity, UserEntity } from '../types/user.types';

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

export const queryRole = async (param: WhereOptions<RoleEntity>) => {
  return RoleModel.findOne({ where: param });
};

export const queryRoles = async () => {
  return RoleModel.findAll({
    order: [['id', 'ASC']],
  });
};

export const addRole = async (param: CreateRoleParams) => {
  return RoleModel.create(param);
};

export const updateRole = async (roleKey: string, param: Partial<RoleEntity>) => {
  return RoleModel.update(param, {
    where: { role_key: roleKey },
  });
};

export const deleteRole = async (roleKey: string) => {
  return RoleModel.destroy({
    where: { role_key: roleKey },
  });
};

export const countUsersByRoleKey = async (roleKey: string) => {
  return UserModel.count({
    where: {
      role_key: roleKey,
    },
  });
};

export const parseRoleFeatures = (raw: string | undefined) => {
  if (!raw) {
    return [] as AppFeature[];
  }

  try {
    const features = JSON.parse(raw) as string[];
    const validSet = new Set(Object.values(AppFeature));
    return features.filter(item => validSet.has(item as AppFeature)) as AppFeature[];
  } catch {
    return [] as AppFeature[];
  }
};

export const stringifyRoleFeatures = (features: AppFeature[]) => {
  const validSet = new Set(Object.values(AppFeature));
  const data = features.filter(item => validSet.has(item));
  return JSON.stringify(Array.from(new Set(data)));
};

export const getUsersByRoleKeys = async (roleKeys: string[]) => {
  if (roleKeys.length === 0) {
    return [];
  }
  return UserModel.findAll({
    where: {
      role_key: {
        [Op.in]: roleKeys,
      },
    },
  });
};
