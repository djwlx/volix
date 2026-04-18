import { http } from '@/utils';
import type {
  CreateSqliteAdminRowPayload,
  DeleteSqliteAdminRowPayload,
  SqliteAdminMutationResponse,
  SqliteAdminTableDetailResponse,
  SqliteAdminTableListResponse,
  UpdateSqliteAdminRowPayload,
} from '@volix/types';

export const listSqliteAdminTables = () => {
  return http.get<SqliteAdminTableListResponse>('/sqlite-admin/tables');
};

export const getSqliteAdminTableDetail = (tableName: string, params?: { page?: number; pageSize?: number }) => {
  return http.get<SqliteAdminTableDetailResponse>(`/sqlite-admin/tables/${encodeURIComponent(tableName)}`, {
    params,
  });
};

export const createSqliteAdminRow = (tableName: string, data: CreateSqliteAdminRowPayload) => {
  return http.post<SqliteAdminMutationResponse>(`/sqlite-admin/tables/${encodeURIComponent(tableName)}/rows`, data);
};

export const updateSqliteAdminRow = (tableName: string, data: UpdateSqliteAdminRowPayload) => {
  return http.put<SqliteAdminMutationResponse>(`/sqlite-admin/tables/${encodeURIComponent(tableName)}/rows`, data);
};

export const deleteSqliteAdminRow = (tableName: string, data: DeleteSqliteAdminRowPayload) => {
  return http.delete<SqliteAdminMutationResponse>(`/sqlite-admin/tables/${encodeURIComponent(tableName)}/rows`, {
    data,
  });
};
