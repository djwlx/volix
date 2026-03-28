export interface LoginUserPayload {
  email: string;
  password: string;
}

export interface RegisterUserPayload {
  email: string;
  password: string;
}

export interface LoginUserResponse {
  token: string;
}
