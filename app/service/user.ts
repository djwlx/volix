import { UserModel } from '../model';

class UserService {
  query = async (param: any) => {
    return UserModel.findOne({ where: param });
  };

  add = async (param: any) => {
    return UserModel.create(param);
  };
}

const userService = new UserService();

export { userService };
