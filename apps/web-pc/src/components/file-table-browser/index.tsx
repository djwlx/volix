import { useEffect, useState, type ReactNode } from 'react';
import { Button, Dropdown, Empty, Spin, Table, Typography } from '@douyinfe/semi-ui';
import { IconArrowLeft, IconMore, IconRefresh } from '@douyinfe/semi-icons';
import type { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import { useI18n } from '@/i18n';
import styles from './index.module.scss';
import type { FileTableAction, FileTableBrowserProps } from './types';

export type {
  FileTableAction,
  FileTableBreadcrumbSegment,
  FileTableBrowserProps,
  FileTableColumn,
  FileTablePagination,
  FileTableSelection,
} from './types';

type FileTableRecord = Record<string, unknown>;

const DEFAULT_NAME_MAX_WIDTH = 640;
const ACTION_MENU_BREAKPOINT = 1024;
const ACTION_MENU_COLUMN_WIDTH = 56;
const ACTION_INLINE_COLUMN_WIDTH = 220;

const ellipsisStyle = {
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

export function getCompactPathSegmentLabel(label: string) {
  if (label === '/') {
    return label;
  }

  const chars = Array.from(label);
  if (chars.length <= 4) {
    return label;
  }

  return `${chars[0]}...${chars[chars.length - 1]}`;
}

export function FileTableBrowser<T>(props: FileTableBrowserProps<T>) {
  const {
    rows,
    rowKey,
    isDir,
    getName,
    loading,
    disabled,
    nameTitle,
    nameMaxWidth = DEFAULT_NAME_MAX_WIDTH,
    columns = [],
    actions,
    actionTitle,
    breadcrumb,
    pathLabel,
    pathTitle,
    onNavigate,
    onEnterDir,
    onRefresh,
    refreshLabel,
    parentLabel,
    selection,
    pagination,
    emptyText,
    loadingText,
    testId,
  } = props;
  const { t } = useI18n();
  const [compactActionMode, setCompactActionMode] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(`(max-width: ${ACTION_MENU_BREAKPOINT}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const media = window.matchMedia(`(max-width: ${ACTION_MENU_BREAKPOINT}px)`);
    const handleChange = (event: MediaQueryListEvent) => {
      setCompactActionMode(event.matches);
    };
    setCompactActionMode(media.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const canGoParent = breadcrumb.length > 1;
  const parentValue = canGoParent ? breadcrumb[breadcrumb.length - 2]?.value : undefined;

  const renderActions = (record: T): ReactNode => {
    const visibleActions = (actions || []).filter(action => action.visible?.(record) ?? true);
    if (!visibleActions.length) {
      return null;
    }

    if (!compactActionMode) {
      return (
        <div className={styles.inlineActions} onClick={event => event.stopPropagation()}>
          {visibleActions.map((action: FileTableAction<T>) => {
            const isDisabled = disabled || action.disabled?.(record);
            return (
              <Button
                key={action.key}
                size="small"
                theme="borderless"
                disabled={isDisabled}
                className={styles.inlineActionButton}
                onClick={event => {
                  event.stopPropagation();
                  action.onClick(record);
                }}
              >
                {action.label(record)}
              </Button>
            );
          })}
        </div>
      );
    }

    return (
      <Dropdown
        trigger="click"
        position="bottomRight"
        render={
          <Dropdown.Menu>
            {visibleActions.map((action: FileTableAction<T>) => (
              <Dropdown.Item
                key={action.key}
                disabled={disabled || action.disabled?.(record)}
                onClick={event => {
                  event.stopPropagation();
                  action.onClick(record);
                }}
              >
                {action.label(record)}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        }
      >
        <span className={styles.actionTrigger} onClick={event => event.stopPropagation()}>
          <IconMore />
        </span>
      </Dropdown>
    );
  };

  const renderHeaderText = (value: ReactNode) => <span className={styles.headerText}>{value}</span>;

  const renderName = (record: T): ReactNode => {
    const key = rowKey(record);
    const name = getName(record);
    const dir = isDir(record);
    const nameStyle = { ...ellipsisStyle, maxWidth: `${nameMaxWidth}px` };

    if (dir) {
      return (
        <Typography.Text
          data-dir-link={key}
          data-name-cell={key}
          link={!disabled}
          title={name}
          style={nameStyle}
          onClick={disabled ? undefined : () => onEnterDir(record)}
        >
          {name}
        </Typography.Text>
      );
    }

    return (
      <Typography.Text data-name-cell={key} title={name} style={nameStyle}>
        {name}
      </Typography.Text>
    );
  };

  const tableColumns: ColumnProps<FileTableRecord>[] = [
    {
      title: renderHeaderText(nameTitle ?? t('common.fileTable.name')),
      dataIndex: '__name',
      render: (_text: unknown, record: FileTableRecord) => renderName(record as unknown as T),
    },
    ...columns.map(column => ({
      title: renderHeaderText(column.title),
      dataIndex: column.key,
      width: column.width,
      align: column.align,
      render: (_text: unknown, record: FileTableRecord) => column.render(record as unknown as T),
    })),
  ];

  if (actions && actions.length) {
    tableColumns.push({
      title: renderHeaderText(actionTitle ?? ''),
      dataIndex: '__actions',
      width: compactActionMode ? ACTION_MENU_COLUMN_WIDTH : ACTION_INLINE_COLUMN_WIDTH,
      align: 'right',
      render: (_text: unknown, record: FileTableRecord) => renderActions(record as unknown as T),
    });
  }

  return (
    <div className={styles.panel} data-testid={testId}>
      <div className={styles.toolbar}>
        {pathLabel ? (
          <div className={styles.pathLabel}>
            <Typography.Text strong>{pathLabel}</Typography.Text>
          </div>
        ) : null}
        <div
          className={styles.pathStrip}
          data-path-strip="true"
          title={pathTitle}
          style={{ overflowX: 'auto', overflowY: 'hidden', whiteSpace: 'nowrap', wordBreak: 'normal' }}
        >
          {breadcrumb.map((segment, index) => (
            <span key={segment.value} style={{ display: 'inline-flex', minWidth: 0, flex: '0 0 auto' }}>
              {index > 0 && breadcrumb[index - 1]?.label !== '/' ? (
                <span className={styles.pathSeparator}>/</span>
              ) : null}
              <Typography.Text
                data-path-segment={segment.value}
                link={!disabled}
                title={segment.label}
                style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                onClick={disabled ? undefined : () => onNavigate(segment.value)}
              >
                {getCompactPathSegmentLabel(segment.label)}
              </Typography.Text>
            </span>
          ))}
        </div>
        <div className={styles.toolbarActions}>
          <Button
            disabled={disabled || !canGoParent || loading}
            icon={<IconArrowLeft />}
            theme="borderless"
            aria-label={parentLabel ?? t('common.fileTable.parent')}
            onClick={() => parentValue !== undefined && onNavigate(parentValue)}
          />
          <Button disabled={disabled || loading} icon={<IconRefresh />} theme="borderless" onClick={onRefresh}>
            {refreshLabel ?? t('common.fileTable.refresh')}
          </Button>
        </div>
      </div>

      <div className={styles.surface}>
        {loading && !rows.length ? (
          <div className={styles.loadingState}>
            <Spin spinning />
            <div className={styles.loadingText}>{loadingText ?? t('common.fileTable.loading')}</div>
          </div>
        ) : rows.length ? (
          <Spin spinning={Boolean(loading)}>
            <Table<FileTableRecord>
              className={styles.table}
              dataSource={rows as unknown as FileTableRecord[]}
              rowKey={(record?: FileTableRecord) => (record ? rowKey(record as unknown as T) : '')}
              size="small"
              tableLayout="fixed"
              columns={tableColumns}
              pagination={
                pagination
                  ? {
                      currentPage: pagination.currentPage,
                      pageSize: pagination.pageSize,
                      total: pagination.total,
                      size: 'small',
                      hoverShowPageSelect: true,
                      formatPageText: pagination.formatPageText,
                      onPageChange: pagination.onPageChange,
                    }
                  : false
              }
              rowSelection={
                selection
                  ? {
                      selectedRowKeys: selection.selectedKeys,
                      onChange: (nextSelectedRowKeys?: Array<string | number>) =>
                        selection.onChange(nextSelectedRowKeys),
                      getCheckboxProps: (record: FileTableRecord) => ({
                        disabled: disabled || selection.getDisabled?.(record as unknown as T),
                      }),
                    }
                  : undefined
              }
            />
          </Spin>
        ) : (
          <Empty image={null} title={emptyText ?? t('common.fileTable.empty')} />
        )}
      </div>
    </div>
  );
}
