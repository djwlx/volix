import userModel from '../models/user';

class UserService {
  static query = (param: any) => {
    return userModel.findOne({ where: param });
  };

  static add = (param: any) => {
    return userModel.create(param);
  };
}

export default UserService;
