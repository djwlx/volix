import type { ReactNode } from 'react';

export type FileTableColumnAlign = 'left' | 'right' | 'center';

export interface FileTableColumn<T> {
  key: string;
  title: ReactNode;
  width?: number;
  align?: FileTableColumnAlign;
  render: (item: T) => ReactNode;
}

export interface FileTableAction<T> {
  key: string;
  label: (item: T) => string;
  visible?: (item: T) => boolean;
  disabled?: (item: T) => boolean;
  onClick: (item: T) => void;
}

export interface FileTableBreadcrumbSegment {
  label: string;
  value: string;
}

export interface FileTablePagination {
  currentPage: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  formatPageText?: (info?: { currentStart?: number; currentEnd?: number; total?: number }) => ReactNode;
}

export interface FileTableSelection<T> {
  selectedKeys: string[];
  onChange: (selectedRowKeys?: Array<string | number>) => void;
  getDisabled?: (item: T) => boolean;
}

export interface FileTableBrowserProps<T> {
  rows: T[];
  rowKey: (item: T) => string;
  isDir: (item: T) => boolean;
  getName: (item: T) => string;
  loading?: boolean;
  disabled?: boolean;
  nameTitle?: ReactNode;
  nameMaxWidth?: number;
  columns?: FileTableColumn<T>[];
  actions?: FileTableAction<T>[];
  actionTitle?: ReactNode;
  breadcrumb: FileTableBreadcrumbSegment[];
  pathLabel?: ReactNode;
  pathTitle?: string;
  onNavigate: (value: string) => void;
  onEnterDir: (item: T) => void;
  onRefresh: () => void;
  refreshLabel?: ReactNode;
  parentLabel?: string;
  selection?: FileTableSelection<T>;
  pagination?: FileTablePagination;
  emptyText?: ReactNode;
  loadingText?: ReactNode;
  testId?: string;
}
