export interface UserFace {
  face_l: string;
  face_m: string;
  face_s: string;
}

export interface UserCookie {
  UID: string;
  CID: string;
  SEID: string;
  KID: string;
}

export interface UserData {
  user_id: number;
  user_name: string;
  email: string;
  mobile: string;
  country: string;
  is_vip: number;
  mark: number;
  alert: string;
  is_chang_passwd: number;
  is_first_login: number;
  bind_mobile: number;
  face: UserFace;
  passwd_reset: number;
  cookie: UserCookie;
  from: string;
  is_trusted: boolean | null;
}

export interface TokenType {
  uid: string;
  sign: string;
  time: number;
}
