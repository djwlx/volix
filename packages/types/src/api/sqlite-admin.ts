export interface SqliteAdminTableSummary {
  name: string;
  rowCount: number;
}

export interface SqliteAdminColumn {
  name: string;
  type: string;
  notNull: boolean;
  defaultValue?: string | null;
  primaryKey: boolean;
}

export interface SqliteAdminRowIdentity {
  values: Record<string, unknown>;
}

export interface SqliteAdminTableData {
  table: string;
  columns: SqliteAdminColumn[];
  rows: Record<string, unknown>[];
  identityColumns: string[];
  page: number;
  pageSize: number;
  total: number;
}

export interface SqliteAdminTableListResponse {
  items: SqliteAdminTableSummary[];
}

export interface SqliteAdminTableDetailResponse extends SqliteAdminTableData {}

export interface CreateSqliteAdminRowPayload {
  values: Record<string, unknown>;
}

export interface UpdateSqliteAdminRowPayload {
  identity: SqliteAdminRowIdentity;
  values: Record<string, unknown>;
}

export interface DeleteSqliteAdminRowPayload {
  identity: SqliteAdminRowIdentity;
}

export interface SqliteAdminMutationResponse {
  table: string;
  row?: Record<string, unknown>;
  deleted?: boolean;
}
