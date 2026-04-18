import { QueryTypes } from 'sequelize';
import type {
  CreateSqliteAdminRowPayload,
  DeleteSqliteAdminRowPayload,
  SqliteAdminColumn,
  SqliteAdminTableData,
  SqliteAdminTableSummary,
  UpdateSqliteAdminRowPayload,
} from '@volix/types';
import sequelize from '../../../utils/sequelize';
import { badRequest } from '../../shared/http-handler';

type SqliteTableInfoRow = {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
};

type IdentitySpec = {
  identityColumns: string[];
  whereSql: string;
  replacements: unknown[];
};

const SQLITE_SYSTEM_TABLE_PREFIX = 'sqlite_';
const SQLITE_ROWID_COLUMN = '__rowid__';

const quoteIdentifier = (value: string) => {
  return `"${String(value).replace(/"/g, '""')}"`;
};

const listTableNames = async () => {
  const rows = await sequelize.query<{ name: string }>(
    `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name ASC
    `,
    { type: QueryTypes.SELECT }
  );

  return rows.map(item => item.name);
};

const ensureValidTableName = async (tableName: string) => {
  const normalized = String(tableName || '').trim();
  if (!normalized) {
    badRequest('表名不能为空');
  }
  if (normalized.startsWith(SQLITE_SYSTEM_TABLE_PREFIX)) {
    badRequest('不支持系统表');
  }

  const tables = await listTableNames();
  if (!tables.includes(normalized)) {
    badRequest(`表不存在: ${normalized}`);
  }

  return normalized;
};

const getTableColumns = async (tableName: string): Promise<SqliteAdminColumn[]> => {
  const rows = await sequelize.query<SqliteTableInfoRow>(`PRAGMA table_info(${quoteIdentifier(tableName)})`, {
    type: QueryTypes.SELECT,
  });

  return rows.map(item => ({
    name: item.name,
    type: item.type || '',
    notNull: Boolean(item.notnull),
    defaultValue: item.dflt_value,
    primaryKey: item.pk > 0,
  }));
};

const getIdentityColumnNames = (columns: SqliteAdminColumn[]) => {
  const primaryKeys = columns.filter(item => item.primaryKey).map(item => item.name);
  return primaryKeys.length ? primaryKeys : [SQLITE_ROWID_COLUMN];
};

const normalizePage = (value: unknown, fallback: number) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    return fallback;
  }
  return Math.floor(num);
};

const buildIdentitySpec = (
  columns: SqliteAdminColumn[],
  identity: { values?: Record<string, unknown> } | undefined
): IdentitySpec => {
  const identityColumns = getIdentityColumnNames(columns);
  const rawValues = identity?.values;

  if (!rawValues || typeof rawValues !== 'object') {
    badRequest('identity.values 不能为空');
  }
  const identityValues = rawValues as Record<string, unknown>;

  const replacements = identityColumns.map(columnName => {
    if (!(columnName in identityValues)) {
      badRequest(`缺少 identity 字段: ${columnName}`);
    }
    return identityValues[columnName];
  });

  const whereSql = identityColumns
    .map(columnName => {
      if (columnName === SQLITE_ROWID_COLUMN) {
        return 'rowid = ?';
      }
      return `${quoteIdentifier(columnName)} = ?`;
    })
    .join(' AND ');

  return {
    identityColumns,
    whereSql,
    replacements,
  };
};

const ensureEditableValues = (
  payload: Record<string, unknown>,
  columns: SqliteAdminColumn[],
  disallowedColumns: string[] = []
) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    badRequest('values 必须是对象');
  }

  const entries = Object.entries(payload);
  if (!entries.length) {
    badRequest('values 不能为空');
  }

  const allowedColumns = new Set(columns.map(item => item.name));

  for (const [key] of entries) {
    if (!allowedColumns.has(key)) {
      badRequest(`非法字段: ${key}`);
    }
    if (disallowedColumns.includes(key)) {
      badRequest(`不允许直接修改标识字段: ${key}`);
    }
  }

  return entries;
};

const selectRowByWhere = async (tableName: string, whereSql: string, replacements: unknown[]) => {
  const rows = await sequelize.query<Record<string, unknown>>(
    `
      SELECT rowid AS "__rowid__", *
      FROM ${quoteIdentifier(tableName)}
      WHERE ${whereSql}
      LIMIT 1
    `,
    {
      replacements,
      type: QueryTypes.SELECT,
    }
  );

  return rows[0] || null;
};

export const listSqliteAdminTables = async (): Promise<SqliteAdminTableSummary[]> => {
  const tableNames = await listTableNames();
  const items = await Promise.all(
    tableNames.map(async tableName => {
      const rows = await sequelize.query<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${quoteIdentifier(tableName)}`,
        { type: QueryTypes.SELECT }
      );

      return {
        name: tableName,
        rowCount: Number(rows[0]?.count || 0),
      };
    })
  );

  return items;
};

export const getSqliteAdminTableData = async (
  rawTableName: string,
  options?: {
    page?: unknown;
    pageSize?: unknown;
  }
): Promise<SqliteAdminTableData> => {
  const tableName = await ensureValidTableName(rawTableName);
  const columns = await getTableColumns(tableName);
  const identityColumns = getIdentityColumnNames(columns);
  const page = normalizePage(options?.page, 1);
  const pageSize = Math.min(normalizePage(options?.pageSize, 20), 100);
  const offset = (page - 1) * pageSize;

  const [{ count }] = await sequelize.query<{ count: number }>(
    `SELECT COUNT(*) as count FROM ${quoteIdentifier(tableName)}`,
    { type: QueryTypes.SELECT }
  );

  const orderBySql = identityColumns
    .map(columnName => (columnName === SQLITE_ROWID_COLUMN ? 'rowid DESC' : `${quoteIdentifier(columnName)} DESC`))
    .join(', ');

  const rows = await sequelize.query<Record<string, unknown>>(
    `
      SELECT rowid AS "__rowid__", *
      FROM ${quoteIdentifier(tableName)}
      ORDER BY ${orderBySql}
      LIMIT ? OFFSET ?
    `,
    {
      replacements: [pageSize, offset],
      type: QueryTypes.SELECT,
    }
  );

  return {
    table: tableName,
    columns,
    rows,
    identityColumns,
    page,
    pageSize,
    total: Number(count || 0),
  };
};

export const createSqliteAdminRow = async (rawTableName: string, payload: CreateSqliteAdminRowPayload) => {
  const tableName = await ensureValidTableName(rawTableName);
  const columns = await getTableColumns(tableName);
  const entries = ensureEditableValues(payload?.values || {}, columns);

  const columnSql = entries.map(([key]) => quoteIdentifier(key)).join(', ');
  const valueSql = entries.map(() => '?').join(', ');
  const replacements = entries.map(([, value]) => value);

  await sequelize.query(
    `
      INSERT INTO ${quoteIdentifier(tableName)} (${columnSql})
      VALUES (${valueSql})
    `,
    {
      replacements,
      type: QueryTypes.INSERT,
    }
  );

  const [{ id }] = await sequelize.query<{ id: number }>('SELECT last_insert_rowid() as id', {
    type: QueryTypes.SELECT,
  });

  const row = await selectRowByWhere(tableName, 'rowid = ?', [id]);

  return {
    table: tableName,
    row: row || undefined,
  };
};

export const updateSqliteAdminRow = async (rawTableName: string, payload: UpdateSqliteAdminRowPayload) => {
  const tableName = await ensureValidTableName(rawTableName);
  const columns = await getTableColumns(tableName);
  const identitySpec = buildIdentitySpec(columns, payload.identity);
  const entries = ensureEditableValues(
    payload?.values || {},
    columns,
    identitySpec.identityColumns.filter(item => item !== SQLITE_ROWID_COLUMN)
  );

  const setSql = entries.map(([key]) => `${quoteIdentifier(key)} = ?`).join(', ');
  const replacements = [...entries.map(([, value]) => value), ...identitySpec.replacements];

  await sequelize.query(
    `
      UPDATE ${quoteIdentifier(tableName)}
      SET ${setSql}
      WHERE ${identitySpec.whereSql}
    `,
    {
      replacements,
      type: QueryTypes.UPDATE,
    }
  );

  const row = await selectRowByWhere(tableName, identitySpec.whereSql, identitySpec.replacements);

  return {
    table: tableName,
    row: row || undefined,
  };
};

export const deleteSqliteAdminRow = async (rawTableName: string, payload: DeleteSqliteAdminRowPayload) => {
  const tableName = await ensureValidTableName(rawTableName);
  const columns = await getTableColumns(tableName);
  const identitySpec = buildIdentitySpec(columns, payload.identity);

  await sequelize.query(
    `
      DELETE FROM ${quoteIdentifier(tableName)}
      WHERE ${identitySpec.whereSql}
    `,
    {
      replacements: identitySpec.replacements,
      type: QueryTypes.DELETE,
    }
  );

  return {
    table: tableName,
    deleted: true,
  };
};
