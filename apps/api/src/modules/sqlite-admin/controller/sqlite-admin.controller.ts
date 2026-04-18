import { UserRole } from '@volix/types';
import type {
  CreateSqliteAdminRowPayload,
  DeleteSqliteAdminRowPayload,
  UpdateSqliteAdminRowPayload,
} from '@volix/types';
import { unauthorized } from '../../shared/http-handler';
import {
  createSqliteAdminRow,
  deleteSqliteAdminRow,
  getSqliteAdminTableData,
  listSqliteAdminTables,
  updateSqliteAdminRow,
} from '../service/sqlite-admin.service';

const ensureAdmin = (ctx: Parameters<MyMiddleware>[0]) => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized('仅管理员可操作数据库');
  }
};

export const listSqliteAdminTablesAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  return {
    items: await listSqliteAdminTables(),
  };
};

export const getSqliteAdminTableDetailAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  return getSqliteAdminTableData(String(ctx.params.tableName || ''), {
    page: ctx.query.page,
    pageSize: ctx.query.pageSize,
  });
};

export const createSqliteAdminRowAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  return createSqliteAdminRow(String(ctx.params.tableName || ''), ctx.request.body as CreateSqliteAdminRowPayload);
};

export const updateSqliteAdminRowAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  return updateSqliteAdminRow(String(ctx.params.tableName || ''), ctx.request.body as UpdateSqliteAdminRowPayload);
};

export const deleteSqliteAdminRowAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  return deleteSqliteAdminRow(String(ctx.params.tableName || ''), ctx.request.body as DeleteSqliteAdminRowPayload);
};
