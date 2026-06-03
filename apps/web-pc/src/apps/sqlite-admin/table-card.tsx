import type { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import { Button, Card, Empty, LocaleProvider, Table } from '@douyinfe/semi-ui';
import { IconPlus, IconRefresh } from '@douyinfe/semi-icons';
import enUS from '@douyinfe/semi-ui/lib/es/locale/source/en_US';
import zhCN from '@douyinfe/semi-ui/lib/es/locale/source/zh_CN';
import type { Locale, TranslationInput } from '@volix/i18n';
import type { SqliteAdminTableData } from '@volix/types';
import styles from './index.module.scss';

interface SqliteAdminTableCardProps {
  detailLoading: boolean;
  identityColumns: string[];
  locale: Locale;
  onCreateRow: () => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  page: number;
  pageSize: number;
  tableColumns: ColumnProps<Record<string, unknown>>[];
  tableDetail?: SqliteAdminTableData;
  t: (input: TranslationInput, values?: Record<string, unknown>) => string;
}

const getSemiLocale = (locale: Locale) => (locale === 'zh-CN' ? zhCN : enUS);

const buildIdentityValues = (row: Record<string, unknown>, identityColumns: string[]) =>
  identityColumns.reduce<Record<string, unknown>>((acc, key) => {
    acc[key] = row[key];
    return acc;
  }, {});

export function SqliteAdminTableCard({
  detailLoading,
  identityColumns,
  locale,
  onCreateRow,
  onPageChange,
  onRefresh,
  page,
  pageSize,
  tableColumns,
  tableDetail,
  t,
}: SqliteAdminTableCardProps) {
  return (
    <Card className={styles.mainCard} bodyStyle={{ padding: 20, height: '100%' }}>
      {tableDetail ? (
        <div className={styles.mainBody}>
          <div className={styles.mainHeader}>
            <div>
              <div className={styles.mainTitle}>{tableDetail.table}</div>
            </div>
            <div className={styles.toolbar}>
              <Button icon={<IconRefresh />} onClick={onRefresh}>
                {t('sqliteAdmin.action.refresh')}
              </Button>
              <Button type="primary" icon={<IconPlus />} onClick={onCreateRow}>
                {t('sqliteAdmin.action.createRow')}
              </Button>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <LocaleProvider locale={getSemiLocale(locale)}>
              <Table<Record<string, unknown>>
                rowKey={record => JSON.stringify(buildIdentityValues(record || {}, identityColumns))}
                dataSource={tableDetail.rows}
                columns={tableColumns}
                loading={detailLoading}
                pagination={{
                  currentPage: page,
                  pageSize,
                  total: tableDetail.total,
                  onPageChange,
                }}
                scroll={{ x: 'max-content' }}
              />
            </LocaleProvider>
          </div>

          <div className={styles.identityNote}>
            {t('sqliteAdmin.identityColumns', { columns: identityColumns.join(', ') })}
          </div>
        </div>
      ) : (
        <Empty
          title={t('sqliteAdmin.empty.selectTable.title')}
          description={t('sqliteAdmin.empty.selectTable.description')}
        />
      )}
    </Card>
  );
}
