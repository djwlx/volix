import type { WhereOptions } from 'sequelize';
import { UserModel } from '../model/user.model';
import { CreateUserParams, UserEntity } from '../types/user.types';

export const queryUser = async (param: WhereOptions<UserEntity>) => {
  return UserModel.findOne({ where: param });
};

export const addUser = async (param: CreateUserParams) => {
  return UserModel.create(param);
};
