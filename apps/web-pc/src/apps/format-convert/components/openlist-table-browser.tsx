import { useEffect, useState } from 'react';
import { Button, Empty, Spin, Table, Toast, Typography } from '@douyinfe/semi-ui';
import { IconArrowLeft, IconRefresh } from '@douyinfe/semi-icons';
import type { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import type { FormatConvertOpenlistBrowserItem, FormatConvertOpenlistBrowserResult } from '@volix/types';
import { useI18n } from '@/i18n';
import { browseFormatConvertOpenlist } from '@/services/format-convert';
import { getHttpErrorMessage } from '@/utils/error';
import styles from './workbench.module.scss';

const OPENLIST_BROWSER_PAGE_SIZE = 20;

type OpenlistSelectedFile = {
  path: string;
  name: string;
};

interface OpenlistTableBrowserProps {
  disabled?: boolean;
  selectMode: 'file' | 'dir';
  selectedDirPath?: string;
  selectedPaths?: string[];
  selectionMode?: 'single' | 'multiple';
  onDirSelectionChange?: (path: string) => void;
  onFileSelectionChange?: (items: OpenlistSelectedFile[]) => void;
}

const getParentPath = (currentPath: string) => {
  if (currentPath === '/') {
    return '/';
  }

  const segments = currentPath.split('/').filter(Boolean);
  segments.pop();
  return segments.length ? `/${segments.join('/')}` : '/';
};

const getPathName = (targetPath: string) => {
  const segments = targetPath.split('/').filter(Boolean);
  return segments[segments.length - 1] || targetPath || '/';
};

const toSelectedItems = (
  selectionMode: 'single' | 'multiple',
  selectedPaths: string[],
  pageRows: FormatConvertOpenlistBrowserItem[],
  nextSelectedRowKeys: Array<string | number> | undefined
) => {
  if (selectionMode === 'single') {
    const latestSelectedPath = String(nextSelectedRowKeys?.[nextSelectedRowKeys.length - 1] || '');
    if (!latestSelectedPath) {
      return [];
    }

    const latestSelectedItem = pageRows.find(item => !item.isDir && item.path === latestSelectedPath);
    return latestSelectedItem
      ? [{ path: latestSelectedItem.path, name: latestSelectedItem.name }]
      : [{ path: latestSelectedPath, name: getPathName(latestSelectedPath) }];
  }

  const nextSelectedPathSet = new Set((nextSelectedRowKeys || []).map(item => String(item)));
  const pagePathSet = new Set(pageRows.filter(item => !item.isDir).map(item => item.path));
  const retainedItems = selectedPaths
    .filter(path => !pagePathSet.has(path))
    .map(path => ({ path, name: getPathName(path) }));
  const pageItems = pageRows
    .filter(item => !item.isDir && nextSelectedPathSet.has(item.path))
    .map(item => ({ path: item.path, name: item.name }));

  return [...retainedItems, ...pageItems];
};

export function OpenlistTableBrowser(props: OpenlistTableBrowserProps) {
  const {
    disabled,
    onDirSelectionChange,
    onFileSelectionChange,
    selectMode,
    selectedDirPath,
    selectedPaths = [],
    selectionMode = 'multiple',
  } = props;
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FormatConvertOpenlistBrowserResult | null>(null);
  const [currentPath, setCurrentPath] = useState('/');
  const [page, setPage] = useState(1);

  const load = async (next?: { path?: string; page?: number }) => {
    const nextPath = next?.path ?? currentPath;
    const nextPage = next?.page ?? page;

    try {
      setLoading(true);
      const response = await browseFormatConvertOpenlist({
        path: nextPath,
        page: nextPage,
        perPage: OPENLIST_BROWSER_PAGE_SIZE,
      });
      setCurrentPath(response.data.path);
      setPage(response.data.page);
      setResult(response.data);
      if (selectMode === 'dir') {
        onDirSelectionChange?.(response.data.path);
      }
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('formatConvert.browser.loadFailed')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load({ path: '/', page: 1 });
  }, [selectMode]);

  const rows = (result?.content || []).filter(item => (selectMode === 'dir' ? item.isDir : true));
  const currentBrowsePath = result?.path || currentPath;
  const canGoParent = currentBrowsePath !== '/';

  const columns: ColumnProps<FormatConvertOpenlistBrowserItem>[] = [
    {
      title: t('formatConvert.browser.name'),
      dataIndex: 'name',
      render: (_text, record) =>
        record.isDir ? (
          <Button
            className={styles.browserNameButton}
            disabled={disabled}
            theme="borderless"
            type="tertiary"
            onClick={() => void load({ path: record.path, page: 1 })}
          >
            {record.name}
          </Button>
        ) : (
          <span>{record.name}</span>
        ),
    },
    {
      title: t('formatConvert.browser.type'),
      dataIndex: 'isDir',
      render: (_text, record) => (record.isDir ? t('formatConvert.browser.dir') : t('formatConvert.browser.file')),
    },
  ];

  if (selectMode === 'file') {
    columns.push({
      title: t('formatConvert.browser.action'),
      render: (_text, record) =>
        record.isDir ? null : (
          <Button
            disabled={disabled}
            size="small"
            onClick={() => onFileSelectionChange?.([{ path: record.path, name: record.name }])}
          >
            {t('formatConvert.browser.select')}
          </Button>
        ),
    });
  }

  return (
    <div className={styles.treePanel} data-testid="openlist-table-browser">
      <div className={styles.treeToolbar}>
        <div className={styles.browserCurrentPath}>
          <Typography.Text strong>{t('formatConvert.browser.currentPath')}</Typography.Text>
          <div className={styles.browserPathValue}>
            {selectMode === 'dir' ? selectedDirPath || currentBrowsePath : currentBrowsePath}
          </div>
        </div>
        <div className={styles.browserToolbarActions}>
          <Button
            disabled={disabled || !canGoParent || loading}
            icon={<IconArrowLeft />}
            theme="borderless"
            onClick={() => void load({ path: getParentPath(currentBrowsePath), page: 1 })}
          />
          <Button
            disabled={disabled || loading}
            icon={<IconRefresh />}
            theme="borderless"
            onClick={() => void load({ path: currentBrowsePath, page })}
          >
            {t('formatConvert.browser.refresh')}
          </Button>
        </div>
      </div>

      <div className={styles.treeSurface}>
        {loading && !rows.length ? (
          <div className={styles.treeLoadingState}>
            <Spin spinning />
            <div className={styles.treeLoadingText}>{t('formatConvert.browser.treeLoading')}</div>
          </div>
        ) : rows.length ? (
          <Spin spinning={loading}>
            <Table<FormatConvertOpenlistBrowserItem>
              dataSource={rows}
              rowKey="path"
              size="small"
              columns={columns}
              pagination={{
                currentPage: result?.page || page,
                pageSize: result?.perPage || OPENLIST_BROWSER_PAGE_SIZE,
                total: result?.total || 0,
                onPageChange: nextPage => void load({ path: currentBrowsePath, page: nextPage }),
              }}
              rowSelection={
                selectMode === 'file'
                  ? {
                      selectedRowKeys: selectedPaths,
                      onChange: (nextSelectedRowKeys?: Array<string | number>) =>
                        onFileSelectionChange?.(
                          toSelectedItems(selectionMode, selectedPaths, rows, nextSelectedRowKeys)
                        ),
                      getCheckboxProps: (record: FormatConvertOpenlistBrowserItem) => ({
                        disabled: disabled || record.isDir,
                      }),
                    }
                  : undefined
              }
            />
          </Spin>
        ) : (
          <Empty image={null} title={t('formatConvert.browser.treeEmpty')} />
        )}
      </div>
    </div>
  );
}
