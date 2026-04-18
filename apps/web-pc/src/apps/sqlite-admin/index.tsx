import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from '@/components';
import { useUser } from '@/hooks';
import {
  createSqliteAdminRow,
  deleteSqliteAdminRow,
  getSqliteAdminTableDetail,
  listSqliteAdminTables,
  updateSqliteAdminRow,
} from '@/services/sqlite-admin';
import { getHttpErrorMessage } from '@/utils';
import {
  UserRole,
  type SqliteAdminColumn,
  type SqliteAdminTableData,
  type SqliteAdminTableSummary,
} from '@volix/types';
import { IconDelete, IconEdit, IconPlus, IconRefresh } from '@douyinfe/semi-icons';
import { Button, Card, Empty, Input, Modal, Space, Table, Tag, TextArea, Toast } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router';
import styles from './index.module.scss';

type EditorMode = 'create' | 'edit';

type EditorState = {
  visible: boolean;
  mode: EditorMode;
  values: Record<string, string>;
  identity?: Record<string, unknown>;
};

const DEFAULT_PAGE_SIZE = 20;

const stringifyEditorValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const parseEditorValue = (value: string) => {
  const trimmed = value.trim();
  if (trimmed === 'null') {
    return null;
  }
  if (trimmed === 'true') {
    return true;
  }
  if (trimmed === 'false') {
    return false;
  }
  if (trimmed !== '' && /^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    return JSON.parse(trimmed);
  }
  return value;
};

const buildIdentity = (row: Record<string, unknown>, identityColumns: string[]) => ({
  values: identityColumns.reduce<Record<string, unknown>>((acc, key) => {
    acc[key] = row[key];
    return acc;
  }, {}),
});

const renderCellValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return <Tag color="grey">NULL</Tag>;
  }
  if (typeof value === 'boolean') {
    return <Tag color={value ? 'green' : 'orange'}>{value ? 'true' : 'false'}</Tag>;
  }
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return (
    <div className={styles.valueCell} title={text}>
      {text}
    </div>
  );
};

function SqliteAdminApp() {
  const navigate = useNavigate();
  const { user, loading } = useUser();
  const [tables, setTables] = useState<SqliteAdminTableSummary[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableDetail, setTableDetail] = useState<SqliteAdminTableData>();
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<EditorState>({
    visible: false,
    mode: 'create',
    values: {},
  });
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;
  const columns = tableDetail?.columns || [];
  const identityColumns = tableDetail?.identityColumns || [];

  const editableColumns = useMemo(() => {
    return columns.filter(column => !identityColumns.includes(column.name));
  }, [columns, identityColumns]);

  const loadTables = async () => {
    setTablesLoading(true);
    try {
      const res = await listSqliteAdminTables();
      const items = res.data.items || [];
      setTables(items);
      if (!selectedTable && items[0]?.name) {
        setSelectedTable(items[0].name);
      }
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '获取数据表失败'));
    } finally {
      setTablesLoading(false);
    }
  };

  const loadTableDetail = async (tableName: string, nextPage = page) => {
    if (!tableName) {
      return;
    }
    setDetailLoading(true);
    try {
      const res = await getSqliteAdminTableDetail(tableName, {
        page: nextPage,
        pageSize: DEFAULT_PAGE_SIZE,
      });
      setTableDetail(res.data);
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '获取表数据失败'));
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && isAdmin) {
      loadTables().catch(() => undefined);
    }
  }, [loading, isAdmin]);

  useEffect(() => {
    if (!selectedTable || !isAdmin) {
      return;
    }
    loadTableDetail(selectedTable, page).catch(() => undefined);
  }, [selectedTable, page, isAdmin]);

  const openCreateModal = () => {
    setEditor({
      visible: true,
      mode: 'create',
      values: editableColumns.reduce<Record<string, string>>((acc, column) => {
        acc[column.name] = '';
        return acc;
      }, {}),
    });
  };

  const openEditModal = (row: Record<string, unknown>) => {
    setEditor({
      visible: true,
      mode: 'edit',
      identity: buildIdentity(row, identityColumns).values,
      values: editableColumns.reduce<Record<string, string>>((acc, column) => {
        acc[column.name] = stringifyEditorValue(row[column.name]);
        return acc;
      }, {}),
    });
  };

  const closeEditor = () => {
    setEditor({
      visible: false,
      mode: 'create',
      values: {},
    });
  };

  const submitEditor = async () => {
    if (!selectedTable) {
      return;
    }

    setSaving(true);
    try {
      const parsedValues = Object.entries(editor.values).reduce<Record<string, unknown>>((acc, [key, value]) => {
        acc[key] = parseEditorValue(value);
        return acc;
      }, {});

      if (editor.mode === 'create') {
        await createSqliteAdminRow(selectedTable, {
          values: parsedValues,
        });
        Toast.success('新增成功');
      } else {
        await updateSqliteAdminRow(selectedTable, {
          identity: {
            values: editor.identity || {},
          },
          values: parsedValues,
        });
        Toast.success('更新成功');
      }

      closeEditor();
      await Promise.all([loadTables(), loadTableDetail(selectedTable)]);
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, editor.mode === 'create' ? '新增失败' : '更新失败'));
    } finally {
      setSaving(false);
    }
  };

  const removeRow = (row: Record<string, unknown>) => {
    if (!selectedTable) {
      return;
    }

    Modal.confirm({
      title: '删除这条记录？',
      content: '删除后无法恢复，请确认这是你想要的操作。',
      okButtonProps: {
        type: 'danger',
      },
      onOk: async () => {
        try {
          await deleteSqliteAdminRow(selectedTable, {
            identity: buildIdentity(row, identityColumns),
          });
          Toast.success('删除成功');
          await Promise.all([loadTables(), loadTableDetail(selectedTable)]);
        } catch (error) {
          Toast.error(getHttpErrorMessage(error, '删除失败'));
        }
      },
    });
  };

  if (loading) {
    return <div style={{ padding: 24 }}>加载中...</div>;
  }

  if (!isAdmin) {
    return (
      <div className={styles.page}>
        <AppHeader
          title="SQLite 数据管理"
          description="仅管理员可访问的表格化数据编辑台"
          logo={
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #0f172a, #0284c7)',
              }}
            />
          }
          onLogoClick={() => navigate('/')}
          userOverride={user || undefined}
          userBadge="管理员"
        />
        <div className={styles.content}>
          <Card className={styles.mainCard}>
            <Empty title="暂无权限" description="只有管理员可以直接编辑 SQLite 表数据。" />
          </Card>
        </div>
      </div>
    );
  }

  const tableColumns = [
    ...columns.map(column => ({
      title: column.name,
      dataIndex: column.name,
      key: column.name,
      width: 220,
      render: (value: unknown) => renderCellValue(value),
    })),
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 128,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space>
          <Button
            size="small"
            theme="borderless"
            type="primary"
            icon={<IconEdit />}
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          <Button size="small" theme="borderless" type="danger" icon={<IconDelete />} onClick={() => removeRow(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <AppHeader
        title="SQLite 数据管理"
        description="管理员可直接浏览和编辑当前应用数据库中的表数据"
        logo={
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #020617 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
            }}
          >
            DB
          </div>
        }
        onLogoClick={() => navigate('/')}
        userOverride={user || undefined}
        userBadge="管理员"
      />
      <div className={styles.content}>
        <div className={styles.layout}>
          <Card
            className={styles.sidebarCard}
            bodyStyle={{ padding: 16 }}
            title="数据表"
            headerExtraContent={
              <Button
                theme="borderless"
                icon={<IconRefresh />}
                loading={tablesLoading}
                onClick={() => loadTables().catch(() => undefined)}
              />
            }
          >
            <div className={styles.tableList}>
              {tables.length ? (
                tables.map(table => (
                  <button
                    key={table.name}
                    type="button"
                    className={`${styles.tableItem} ${selectedTable === table.name ? styles.tableItemActive : ''}`}
                    onClick={() => {
                      setSelectedTable(table.name);
                      setPage(1);
                    }}
                  >
                    <div className={styles.tableItemName}>{table.name}</div>
                    <div className={styles.tableItemMeta}>{table.rowCount} 行</div>
                  </button>
                ))
              ) : (
                <Empty title="暂无数据表" />
              )}
            </div>
          </Card>

          <Card className={styles.mainCard} bodyStyle={{ padding: 20, height: '100%' }}>
            {tableDetail ? (
              <div className={styles.mainBody}>
                <div className={styles.mainHeader}>
                  <div>
                    <div className={styles.mainTitle}>{tableDetail.table}</div>
                    <div className={styles.mainDescription}>
                      当前显示第 {tableDetail.page} 页，共 {tableDetail.total} 行。编辑输入支持
                      `null`、`true`、`false`、数字和 JSON。
                    </div>
                  </div>
                  <div className={styles.toolbar}>
                    <Button
                      icon={<IconRefresh />}
                      onClick={() => loadTableDetail(selectedTable).catch(() => undefined)}
                    >
                      刷新
                    </Button>
                    <Button type="primary" icon={<IconPlus />} onClick={openCreateModal}>
                      新增一行
                    </Button>
                  </div>
                </div>

                <div className={styles.tableWrap}>
                  <Table<Record<string, unknown>>
                    rowKey={record => JSON.stringify(buildIdentity(record || {}, identityColumns).values)}
                    dataSource={tableDetail.rows}
                    columns={tableColumns}
                    loading={detailLoading}
                    pagination={{
                      currentPage: page,
                      pageSize: DEFAULT_PAGE_SIZE,
                      total: tableDetail.total,
                      onPageChange: current => setPage(current),
                    }}
                    scroll={{ x: 'max-content' }}
                  />
                </div>

                <div className={styles.identityNote}>行标识字段：{identityColumns.join(', ')}</div>
              </div>
            ) : (
              <Empty title="请选择左侧数据表" description="选中一张表后就可以直接查看、编辑、新增和删除数据。" />
            )}
          </Card>
        </div>
      </div>

      <Modal
        title={editor.mode === 'create' ? `新增到 ${selectedTable}` : `编辑 ${selectedTable}`}
        visible={editor.visible}
        onCancel={closeEditor}
        onOk={() => submitEditor().catch(() => undefined)}
        okButtonProps={{ loading: saving }}
        width={760}
      >
        <div className={styles.modalBody}>
          {editor.mode === 'edit' && editor.identity ? (
            <div className={styles.fieldHint}>当前行标识：{JSON.stringify(editor.identity)}</div>
          ) : null}
          {editableColumns.map((column: SqliteAdminColumn) => (
            <div key={column.name} className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>
                <span>{column.name}</span>
                {column.primaryKey ? <Tag color="blue">主键</Tag> : null}
                {column.notNull ? <Tag color="red">NOT NULL</Tag> : null}
                {column.type ? <Tag color="grey">{column.type}</Tag> : null}
              </div>
              {String(editor.values[column.name] || '').length > 120 ? (
                <TextArea
                  autosize={{ minRows: 3, maxRows: 8 }}
                  value={editor.values[column.name]}
                  onChange={value => {
                    setEditor(current => ({
                      ...current,
                      values: {
                        ...current.values,
                        [column.name]: value,
                      },
                    }));
                  }}
                />
              ) : (
                <Input
                  value={editor.values[column.name]}
                  onChange={value => {
                    setEditor(current => ({
                      ...current,
                      values: {
                        ...current.values,
                        [column.name]: value,
                      },
                    }));
                  }}
                />
              )}
              <div className={styles.fieldHint}>
                默认值：{column.defaultValue ?? '无'}。输入 <code>null</code> 可写入空值，输入对象/数组时会按 JSON
                解析。
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

export default SqliteAdminApp;
