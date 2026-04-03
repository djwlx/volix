import { http } from '@/utils';
import type {
  AdminCreateUserPayload,
  AdminUpdateUserPayload,
  AssignUserRolePayload,
  CreateRolePayload,
  LoginUserPayload,
  LoginUserResponse,
  RoleInfoResponse,
  RegisterUserPayload,
  SetUserRolePayload,
  UpdateRolePayload,
  UpdateUserProfilePayload,
  UserInfoResponse,
} from '@volix/types';

export const loginUser = (data: LoginUserPayload) => {
  return http.post<LoginUserResponse>('/user/login', data);
};

export const registerUser = (data: RegisterUserPayload) => {
  return http.post('/user/register', data);
};

export const getCurrentUser = () => {
  return http.get<UserInfoResponse>('/user/me');
};

export const getUserList = () => {
  return http.get<UserInfoResponse[]>('/user/list');
};

export const setUserRole = (data: SetUserRolePayload) => {
  return http.put<UserInfoResponse>('/user/role', data);
};

export const updateCurrentUserProfile = (data: UpdateUserProfilePayload) => {
  return http.put<UserInfoResponse>('/user/profile', data);
};

export const getRoleList = () => {
  return http.get<RoleInfoResponse[]>('/user/roles');
};

export const createRole = (data: CreateRolePayload) => {
  return http.post<RoleInfoResponse>('/user/roles', data);
};

export const updateRoleInfo = (roleKey: string, data: UpdateRolePayload) => {
  return http.put<RoleInfoResponse>(`/user/roles/${roleKey}`, data);
};

export const removeRole = (roleKey: string) => {
  return http.delete<{ success: boolean }>(`/user/roles/${roleKey}`);
};

export const assignUserRole = (data: AssignUserRolePayload) => {
  return http.put<UserInfoResponse>('/user/assign-role', data);
};

export const getUserDetail = (id: string | number) => {
  return http.get<UserInfoResponse>(`/user/${id}`);
};

export const adminCreateUser = (data: AdminCreateUserPayload) => {
  return http.post<UserInfoResponse>('/user/admin-create', data);
};

export const adminUpdateUser = (id: string | number, data: AdminUpdateUserPayload) => {
  return http.put<UserInfoResponse>(`/user/${id}`, data);
};
