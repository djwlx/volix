export type { LoginUserPayload, RegisterUserPayload } from '@volix/types';

export interface UserEntity {
  id?: string;
  email: string;
  nickname?: string;
  password: string;
  role?: 'user' | 'admin';
}

export interface UserQueryParams {
  id?: string;
  email?: string;
  password?: string;
  nickname?: string;
  role?: 'user' | 'admin';
}

export interface CreateUserParams {
  email: string;
  password: string;
  nickname?: string;
  role?: 'user' | 'admin';
}
