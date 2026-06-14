import jwt from 'jsonwebtoken';
import config from '../../config/index';
import { getJwtSecret } from './secrets';

interface JwtData {
  id: string | number;
}

class JWT {
  static setToken(data: JwtData) {
    return jwt.sign(data, getJwtSecret(), { expiresIn: config.jwtExpiresIn } as jwt.SignOptions);
  }
  static getData(token: string): JwtData {
    const data = jwt.verify(token, getJwtSecret());
    if (typeof data === 'string' || !data || !('id' in data)) {
      throw new Error('无效的token');
    }
    return data as JwtData;
  }
}

export default JWT;
