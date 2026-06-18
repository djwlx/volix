import { useEffect, useRef, useState } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import type { FormatConvertOpenlistBrowserItem, FormatConvertOpenlistBrowserResult } from '@volix/types';
import { FileTableBrowser, type FileTableColumn } from '@/components/file-table-browser';
import { useI18n } from '@/i18n';
import { browseFormatConvertOpenlist } from '@/services/format-convert';
import { getHttpErrorMessage } from '@/utils/error';

const OPENLIST_BROWSER_PAGE_SIZE = 20;
const OPENLIST_DIR_BROWSER_FETCH_SIZE = 500;
const OPENLIST_NAME_MAX_WIDTH = 640;

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

const getPathName = (targetPath: string) => {
  const segments = targetPath.split('/').filter(Boolean);
  return segments[segments.length - 1] || targetPath || '/';
};

const getPathSegments = (targetPath: string) => {
  const segments = targetPath.split('/').filter(Boolean);
  return [
    { label: '/', value: '/' },
    ...segments.map((segment, index) => ({
      label: segment,
      value: `/${segments.slice(0, index + 1).join('/')}`,
    })),
  ];
};

const formatFileSize = (size?: number) => {
  if (typeof size !== 'number' || Number.isNaN(size) || size < 0) {
    return '';
  }

  if (size < 1024) {
    return `${size} B`;
  }

  const units = ['KiB', 'MiB', 'GiB', 'TiB'];
  let value = size;
  let unitIndex = -1;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = value >= 10 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
};

const toSelectedItems = (
  selectionMode: 'single' | 'multiple',
  selectedPaths: string[],
  pageRows: FormatConvertOpenlistBrowserItem[],
  nextSelectedRowKeys: Array<string | number> | undefined
) => {
  if (selectionMode === 'single') {
    const nextSelectedPaths = Array.from(
      new Set((nextSelectedRowKeys || []).map(item => String(item)).filter(Boolean))
    );
    if (!nextSelectedPaths.length) {
      return [];
    }

    const nextSelectedPath =
      nextSelectedPaths.find(path => !selectedPaths.includes(path)) || nextSelectedPaths[0] || '';
    const nextSelectedItem = pageRows.find(item => !item.isDir && item.path === nextSelectedPath);

    return nextSelectedItem
      ? [{ path: nextSelectedItem.path, name: nextSelectedItem.name }]
      : [{ path: nextSelectedPath, name: getPathName(nextSelectedPath) }];
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
  const requestIdRef = useRef(0);

  const loadDirResult = async (nextPath: string, nextPage: number, requestId: number) => {
    const dirItems: FormatConvertOpenlistBrowserItem[] = [];
    let fetchPage = 1;
    let mixedItemCount = 0;
    let total = 0;

    while (true) {
      const response = await browseFormatConvertOpenlist({
        path: nextPath,
        page: fetchPage,
        perPage: OPENLIST_DIR_BROWSER_FETCH_SIZE,
      });

      if (requestId !== requestIdRef.current) {
        return null;
      }

      total = response.data.total;
      mixedItemCount += response.data.content.length;
      dirItems.push(...(response.data.content || []).filter(item => item.isDir));

      if (!response.data.content.length || mixedItemCount >= total) {
        break;
      }

      fetchPage += 1;
    }

    const start = (nextPage - 1) * OPENLIST_BROWSER_PAGE_SIZE;
    return {
      path: nextPath,
      page: nextPage,
      perPage: OPENLIST_BROWSER_PAGE_SIZE,
      total: dirItems.length,
      content: dirItems.slice(start, start + OPENLIST_BROWSER_PAGE_SIZE),
    } satisfies FormatConvertOpenlistBrowserResult;
  };

  const load = async (next?: { path?: string; page?: number }) => {
    const nextPath = next?.path ?? currentPath;
    const nextPage = next?.page ?? page;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setLoading(true);
      const nextResult =
        selectMode === 'dir'
          ? await loadDirResult(nextPath, nextPage, requestId)
          : (
              await browseFormatConvertOpenlist({
                path: nextPath,
                page: nextPage,
                perPage: OPENLIST_BROWSER_PAGE_SIZE,
              })
            ).data;

      if (!nextResult || requestId !== requestIdRef.current) {
        return;
      }

      setCurrentPath(nextResult.path);
      setPage(nextResult.page);
      setResult(nextResult);
      if (selectMode === 'dir') {
        onDirSelectionChange?.(nextResult.path);
      }
    } catch (error) {
      if (requestId === requestIdRef.current) {
        Toast.error(getHttpErrorMessage(error, t('formatConvert.browser.loadFailed')));
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void load({ path: '/', page: 1 });
  }, [selectMode]);

  const rows = (result?.content || []).filter(item => (selectMode === 'dir' ? item.isDir : true));
  const currentBrowsePath = result?.path || currentPath;
  const displayPath = selectMode === 'dir' ? selectedDirPath || currentBrowsePath : currentBrowsePath;

  const columns: FileTableColumn<FormatConvertOpenlistBrowserItem>[] = [
    {
      key: 'size',
      title: t('formatConvert.browser.size'),
      width: 96,
      render: record => (
        <span data-size-cell={record.path}>{record.isDir ? '-' : formatFileSize(record.size) || '-'}</span>
      ),
    },
  ];

  return (
    <FileTableBrowser<FormatConvertOpenlistBrowserItem>
      testId="openlist-table-browser"
      rows={rows}
      loading={loading}
      disabled={disabled}
      rowKey={record => record.path}
      isDir={record => record.isDir}
      getName={record => record.name}
      nameTitle={t('formatConvert.browser.name')}
      nameMaxWidth={OPENLIST_NAME_MAX_WIDTH}
      columns={columns}
      breadcrumb={getPathSegments(displayPath)}
      pathLabel={t('formatConvert.browser.currentPath')}
      pathTitle={displayPath}
      refreshLabel={t('formatConvert.browser.refresh')}
      emptyText={t('formatConvert.browser.treeEmpty')}
      loadingText={t('formatConvert.browser.treeLoading')}
      onNavigate={value => void load({ path: value, page: 1 })}
      onEnterDir={record => void load({ path: record.path, page: 1 })}
      onRefresh={() => void load({ path: currentBrowsePath, page })}
      pagination={{
        currentPage: result?.page || page,
        pageSize: result?.perPage || OPENLIST_BROWSER_PAGE_SIZE,
        total: result?.total || 0,
        onPageChange: nextPage => void load({ path: currentBrowsePath, page: nextPage }),
        formatPageText: pageInfo =>
          t('formatConvert.browser.paginationSummary', {
            start: pageInfo?.currentStart ?? 0,
            end: pageInfo?.currentEnd ?? 0,
            total: pageInfo?.total ?? 0,
          }),
      }}
      selection={
        selectMode === 'file'
          ? {
              selectedKeys: selectedPaths,
              onChange: nextSelectedRowKeys =>
                onFileSelectionChange?.(toSelectedItems(selectionMode, selectedPaths, rows, nextSelectedRowKeys)),
              getDisabled: record => record.isDir,
            }
          : undefined
      }
    />
  );
}
