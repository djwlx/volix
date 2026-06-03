import { useEffect, useMemo, useRef, useState } from 'react';
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
import { useI18n } from '@/i18n';
import { IconDelete, IconEdit, IconRefresh } from '@douyinfe/semi-icons';
import { Button, Card, Empty, Input, Modal, Space, Tag, TextArea, Toast } from '@douyinfe/semi-ui';
import styles from './index.module.scss';
import { SqliteAdminTableCard } from './table-card';

type EditorMode = 'create' | 'edit';

type EditorState = {
  visible: boolean;
  mode: EditorMode;
  values: Record<string, string>;
  identity?: Record<string, unknown>;
};

const DEFAULT_PAGE_SIZE = 20;
const MOBILE_TABLE_BREAKPOINT = '(max-width: 1023px)';

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
  const { locale, t } = useI18n();
  const { user, loading } = useUser();
  const [tables, setTables] = useState<SqliteAdminTableSummary[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableDetail, setTableDetail] = useState<SqliteAdminTableData>();
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(1);
  const tableDetailRequestSeqRef = useRef(0);
  const [isMobileTableLayout, setIsMobileTableLayout] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(MOBILE_TABLE_BREAKPOINT).matches;
  });
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
      Toast.error(getHttpErrorMessage(error, t('sqliteAdmin.error.loadTablesFailed')));
    } finally {
      setTablesLoading(false);
    }
  };

  const loadTableDetail = async (tableName: string, nextPage = page) => {
    if (!tableName) {
      return;
    }
    const requestSeq = ++tableDetailRequestSeqRef.current;
    setDetailLoading(true);
    try {
      const res = await getSqliteAdminTableDetail(tableName, {
        page: nextPage,
        pageSize: DEFAULT_PAGE_SIZE,
      });
      if (requestSeq === tableDetailRequestSeqRef.current) {
        setTableDetail(res.data);
      }
    } catch (error) {
      if (requestSeq === tableDetailRequestSeqRef.current) {
        Toast.error(getHttpErrorMessage(error, t('sqliteAdmin.error.loadTableDataFailed')));
      }
    } finally {
      if (requestSeq === tableDetailRequestSeqRef.current) {
        setDetailLoading(false);
      }
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

  useEffect(() => {
    setTableDetail(undefined);
    setEditor({
      visible: false,
      mode: 'create',
      values: {},
    });
  }, [selectedTable]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(MOBILE_TABLE_BREAKPOINT);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileTableLayout(event.matches);
    };

    setIsMobileTableLayout(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

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
        Toast.success(t('sqliteAdmin.createSuccess'));
      } else {
        await updateSqliteAdminRow(selectedTable, {
          identity: {
            values: editor.identity || {},
          },
          values: parsedValues,
        });
        Toast.success(t('sqliteAdmin.updateSuccess'));
      }

      closeEditor();
      await Promise.all([loadTables(), loadTableDetail(selectedTable)]);
    } catch (error) {
      Toast.error(
        getHttpErrorMessage(
          error,
          t(editor.mode === 'create' ? 'sqliteAdmin.error.createFailed' : 'sqliteAdmin.error.updateFailed')
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const removeRow = (row: Record<string, unknown>) => {
    if (!selectedTable) {
      return;
    }

    Modal.confirm({
      title: t('sqliteAdmin.deleteConfirm.title'),
      content: t('sqliteAdmin.deleteConfirm.description'),
      okButtonProps: {
        type: 'danger',
      },
      onOk: async () => {
        try {
          await deleteSqliteAdminRow(selectedTable, {
            identity: buildIdentity(row, identityColumns),
          });
          Toast.success(t('sqliteAdmin.deleteSuccess'));
          await Promise.all([loadTables(), loadTableDetail(selectedTable)]);
        } catch (error) {
          Toast.error(getHttpErrorMessage(error, t('sqliteAdmin.error.deleteFailed')));
        }
      },
    });
  };

  if (loading) {
    return <div style={{ padding: 24 }}>{t('common.status.loading')}</div>;
  }

  if (!isAdmin) {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <Card className={styles.mainCard}>
            <Empty
              title={t('sqliteAdmin.empty.noPermission.title')}
              description={t('sqliteAdmin.empty.noPermission.description')}
            />
          </Card>
        </div>
      </div>
    );
  }

  const tableColumns = useMemo(() => {
    return [
      ...columns.map(column => ({
        title: column.name,
        dataIndex: column.name,
        key: column.name,
        width: 220,
        render: (value: unknown) => renderCellValue(value),
      })),
      {
        title: t('sqliteAdmin.table.action'),
        key: 'action',
        fixed: isMobileTableLayout ? undefined : ('right' as const),
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
              {t('sqliteAdmin.action.edit')}
            </Button>
            <Button
              size="small"
              theme="borderless"
              type="danger"
              icon={<IconDelete />}
              onClick={() => removeRow(record)}
            >
              {t('sqliteAdmin.action.delete')}
            </Button>
          </Space>
        ),
      },
    ];
  }, [columns, isMobileTableLayout, openEditModal, removeRow]);

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.layout}>
          <Card
            className={styles.sidebarCard}
            bodyStyle={{ padding: 16 }}
            title={t('sqliteAdmin.sidebar.title')}
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
                      if (selectedTable === table.name) {
                        return;
                      }
                      setSelectedTable(table.name);
                      setPage(1);
                    }}
                  >
                    <div className={styles.tableItemName}>{table.name}</div>
                    <div className={styles.tableItemMeta}>
                      {t('sqliteAdmin.sidebar.rowCount', { count: table.rowCount })}
                    </div>
                  </button>
                ))
              ) : (
                <Empty title={t('sqliteAdmin.empty.noTables')} />
              )}
            </div>
          </Card>

          <SqliteAdminTableCard
            detailLoading={detailLoading}
            identityColumns={identityColumns}
            locale={locale}
            onCreateRow={openCreateModal}
            onPageChange={setPage}
            onRefresh={() => loadTableDetail(selectedTable).catch(() => undefined)}
            page={page}
            pageSize={DEFAULT_PAGE_SIZE}
            tableColumns={tableColumns}
            tableDetail={tableDetail}
            t={t}
          />
        </div>
      </div>

      <Modal
        title={t(editor.mode === 'create' ? 'sqliteAdmin.modal.createTitle' : 'sqliteAdmin.modal.editTitle', {
          table: selectedTable,
        })}
        visible={editor.visible}
        onCancel={closeEditor}
        onOk={() => submitEditor().catch(() => undefined)}
        okButtonProps={{ loading: saving }}
        width={760}
      >
        <div className={styles.modalBody}>
          {editor.mode === 'edit' && editor.identity ? (
            <div className={styles.fieldHint}>
              {t('sqliteAdmin.modal.currentIdentity', { value: JSON.stringify(editor.identity) })}
            </div>
          ) : null}
          {editableColumns.map((column: SqliteAdminColumn) => (
            <div key={column.name} className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>
                <span>{column.name}</span>
                {column.primaryKey ? <Tag color="blue">{t('sqliteAdmin.tag.primaryKey')}</Tag> : null}
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
                {t('sqliteAdmin.modal.fieldHint', { defaultValue: column.defaultValue ?? t('common.status.none') })}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

export default SqliteAdminApp;
