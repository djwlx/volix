import sequelize from '../../apps/api/src/utils/sequelize';
import {
  createSqliteAdminRow,
  deleteSqliteAdminRow,
  getSqliteAdminTableData,
  listSqliteAdminTables,
  updateSqliteAdminRow,
} from '../../apps/api/src/modules/sqlite-admin/service/sqlite-admin.service';

const tableName = `codex_sqlite_admin_test_${Date.now().toString(36)}`;

describe('sqlite admin service', () => {
  beforeAll(async () => {
    await sequelize.query(`
      CREATE TABLE "${tableName}" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1
      )
    `);
  });

  afterAll(async () => {
    await sequelize.query(`DROP TABLE IF EXISTS "${tableName}"`);
  });

  test('lists table metadata and supports CRUD by primary key', async () => {
    const tables = await listSqliteAdminTables();
    expect(tables.some(item => item.name === tableName)).toBe(true);

    const created = await createSqliteAdminRow(tableName, {
      values: {
        name: 'first-row',
        enabled: 1,
      },
    });

    expect(created.row?.name).toBe('first-row');

    const detail = await getSqliteAdminTableData(tableName, { page: 1, pageSize: 10 });
    expect(detail.identityColumns).toEqual(['id']);
    expect(detail.rows[0]?.name).toBe('first-row');

    const updated = await updateSqliteAdminRow(tableName, {
      identity: {
        values: {
          id: created.row?.id,
        },
      },
      values: {
        name: 'renamed-row',
        enabled: 0,
      },
    });

    expect(updated.row?.name).toBe('renamed-row');
    expect(updated.row?.enabled).toBe(0);

    const deleted = await deleteSqliteAdminRow(tableName, {
      identity: {
        values: {
          id: created.row?.id,
        },
      },
    });

    expect(deleted.deleted).toBe(true);

    const afterDelete = await getSqliteAdminTableData(tableName, { page: 1, pageSize: 10 });
    expect(afterDelete.rows).toHaveLength(0);
  });
});
