import jwt from 'jsonwebtoken';

const key = 'DJWL';

interface JwtData {
  id: string | number;
}

class JWT {
  static setToken(data: JwtData) {
    return jwt.sign(data, key, {
      expiresIn: '48h',
    });
  }
  static getData(token: string): JwtData {
    const data = jwt.verify(token, key);
    if (typeof data === 'string' || !data || !('id' in data)) {
      throw new Error('无效的token');
    }
    return data as JwtData;
  }
}

export default JWT;
