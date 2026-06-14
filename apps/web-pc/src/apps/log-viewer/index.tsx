import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Empty, Input, Select, Spin, Switch, Tabs, Toast } from '@douyinfe/semi-ui';
import { IconDownload, IconRefresh, IconSearch } from '@douyinfe/semi-icons';
import { UserRole } from '@volix/types';
import type { LogViewerEntry, LogViewerLevel, LogViewerType } from '@volix/types';
import { useUser } from '@/hooks';
import { useI18n } from '@/i18n';
import { getHttpErrorMessage } from '@/utils';
import { downloadLogFile, getLogDates, getLogEntries } from '@/services/log-viewer';
import { LogEntryList } from './log-entry-list';
import styles from './index.module.scss';

const PAGE_SIZE = 50;
const AUTO_REFRESH_INTERVAL_MS = 4000;
const LEVELS: LogViewerLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SelectAny = Select as any;

function LogViewerApp() {
  const { t } = useI18n();
  const { user, loading } = useUser();
  const isAdmin = user?.role === UserRole.ADMIN;

  const [type, setType] = useState<LogViewerType>('normal');
  const [dates, setDates] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [levels, setLevels] = useState<LogViewerLevel[]>([]);
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [entries, setEntries] = useState<LogViewerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [fetching, setFetching] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadEntries = useCallback(
    async (targetPage: number, replace: boolean) => {
      if (!date) {
        return;
      }
      setFetching(true);
      try {
        const res = await getLogEntries({
          type,
          date,
          levels,
          keyword: appliedKeyword,
          page: targetPage,
          pageSize: PAGE_SIZE,
        });
        setTotal(res.data.total);
        setPage(targetPage);
        setEntries(prev => (replace ? res.data.items : [...prev, ...res.data.items]));
      } catch (error) {
        Toast.error(
          getHttpErrorMessage(error, t({ id: 'logViewer.error.loadFailed', defaultMessage: '加载日志失败' }))
        );
      } finally {
        setFetching(false);
      }
    },
    [type, date, levels, appliedKeyword, t]
  );

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    getLogDates(type)
      .then(res => {
        const list = res.data.dates;
        setDates(list);
        setDate(list[0] || '');
      })
      .catch(() => {
        setDates([]);
        setDate('');
      });
  }, [type, isAdmin]);

  useEffect(() => {
    if (!isAdmin || !date) {
      setEntries([]);
      setTotal(0);
      return;
    }
    loadEntries(1, true).catch(() => undefined);
  }, [isAdmin, date, levels, appliedKeyword, type, loadEntries]);

  useEffect(() => {
    if (!autoRefresh || !isAdmin || !date) {
      return undefined;
    }
    const timer = setInterval(() => {
      loadEntries(1, true).catch(() => undefined);
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [autoRefresh, isAdmin, date, loadEntries]);

  const handleSearch = () => {
    setAppliedKeyword(keyword.trim());
  };

  const handleDownload = async () => {
    if (!date) {
      return;
    }
    try {
      const blob = await downloadLogFile(type, date);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${type}.${date}.log`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      Toast.error(
        getHttpErrorMessage(error, t({ id: 'logViewer.error.downloadFailed', defaultMessage: '下载日志失败' }))
      );
    }
  };

  if (loading) {
    return <div style={{ padding: 24 }}>{t('common.status.loading')}</div>;
  }

  if (!isAdmin) {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <Card className={styles.card}>
            <Empty
              title={t({ id: 'logViewer.empty.noPermission.title', defaultMessage: '无访问权限' })}
              description={t({
                id: 'logViewer.empty.noPermission.description',
                defaultMessage: '仅管理员可查看运行日志',
              })}
            />
          </Card>
        </div>
      </div>
    );
  }

  const levelOptions = LEVELS.map(level => ({
    value: level,
    label: t({ id: `logViewer.level.${level}`, defaultMessage: level.toUpperCase() }),
  }));
  const dateOptions = dates.map(item => ({ value: item, label: item }));
  const hasMore = entries.length < total;

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <Card className={styles.card}>
          <Tabs
            type="line"
            activeKey={type}
            onChange={key => {
              setType(key as LogViewerType);
              setEntries([]);
            }}
          >
            <Tabs.TabPane tab={t({ id: 'logViewer.type.normal', defaultMessage: '普通日志' })} itemKey="normal" />
            <Tabs.TabPane tab={t({ id: 'logViewer.type.database', defaultMessage: '数据库日志' })} itemKey="database" />
          </Tabs>

          <div className={styles.toolbar}>
            <div className={`${styles.toolbarItem} ${styles.filterControl}`}>
              <SelectAny
                style={{ width: 160 }}
                placeholder={t({ id: 'logViewer.filter.date', defaultMessage: '选择日期' })}
                value={date || undefined}
                optionList={dateOptions}
                onChange={(value: unknown) => setDate(String(value || ''))}
                emptyContent={t({ id: 'logViewer.empty.noDate', defaultMessage: '暂无日志文件' })}
              />
            </div>
            <div className={`${styles.toolbarItem} ${styles.filterControl}`}>
              <SelectAny
                multiple
                style={{ minWidth: 220 }}
                placeholder={t({ id: 'logViewer.filter.level', defaultMessage: '按级别过滤' })}
                value={levels}
                optionList={levelOptions}
                onChange={(value: unknown) => setLevels((value as LogViewerLevel[]) || [])}
                maxTagCount={3}
              />
            </div>
            <div className={`${styles.toolbarItem} ${styles.searchControl}`}>
              <Input
                style={{ width: 220 }}
                placeholder={t({ id: 'logViewer.filter.keyword', defaultMessage: '搜索日志内容' })}
                value={keyword}
                onChange={value => setKeyword(value)}
                onEnterPress={handleSearch}
                showClear
                suffix={<IconSearch onClick={handleSearch} style={{ cursor: 'pointer' }} />}
              />
            </div>
            <div className={styles.spacer} />
            <div className={`${styles.toolbarItem} ${styles.toggleControl}`}>
              <span>{t({ id: 'logViewer.action.autoRefresh', defaultMessage: '自动刷新' })}</span>
              <Switch checked={autoRefresh} onChange={setAutoRefresh} />
            </div>
            <div className={styles.actionButtons}>
              <Button
                icon={<IconRefresh />}
                loading={fetching}
                onClick={() => loadEntries(1, true).catch(() => undefined)}
              >
                {t({ id: 'logViewer.action.refresh', defaultMessage: '刷新' })}
              </Button>
              <Button icon={<IconDownload />} onClick={() => handleDownload().catch(() => undefined)} disabled={!date}>
                {t({ id: 'logViewer.action.download', defaultMessage: '下载' })}
              </Button>
            </div>
          </div>

          <Spin spinning={fetching && entries.length === 0}>
            <LogEntryList
              entries={entries}
              emptyDescription={t({ id: 'logViewer.empty.description', defaultMessage: '当前条件下没有日志记录' })}
            />
          </Spin>

          {hasMore ? (
            <div className={styles.footer}>
              <Button loading={fetching} onClick={() => loadEntries(page + 1, false).catch(() => undefined)}>
                {t('common.action.loadMore')}
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

export default LogViewerApp;
