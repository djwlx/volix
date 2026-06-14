import { Empty, Tag } from '@douyinfe/semi-ui';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag';
import type { LogViewerEntry, LogViewerLevel } from '@volix/types';
import { useI18n } from '@/i18n';
import styles from './index.module.scss';

const LEVEL_TAG_COLOR: Record<LogViewerLevel, TagColor> = {
  trace: 'grey',
  debug: 'cyan',
  info: 'green',
  warn: 'amber',
  error: 'red',
  fatal: 'purple',
};

const LEVEL_BAR_COLOR: Record<LogViewerLevel, string> = {
  trace: '#94a3b8',
  debug: '#06b6d4',
  info: '#22c55e',
  warn: '#f59e0b',
  error: '#ef4444',
  fatal: '#a21caf',
};

interface LogEntryListProps {
  entries: LogViewerEntry[];
  emptyDescription: string;
}

export function LogEntryList({ entries, emptyDescription }: LogEntryListProps) {
  const { t } = useI18n();

  if (entries.length === 0) {
    return (
      <Empty title={t({ id: 'logViewer.empty.title', defaultMessage: '暂无日志' })} description={emptyDescription} />
    );
  }

  return (
    <div className={styles.list}>
      {entries.map((entry, index) => (
        <div className={styles.entry} key={`${entry.timestamp}-${index}`}>
          <span className={styles.bar} style={{ background: LEVEL_BAR_COLOR[entry.level] }} />
          <div className={styles.entryMain}>
            <div className={styles.entryMeta}>
              <Tag color={LEVEL_TAG_COLOR[entry.level]} size="small">
                {t({ id: `logViewer.level.${entry.level}`, defaultMessage: entry.level.toUpperCase() })}
              </Tag>
              <span className={styles.timestamp}>{entry.timestamp}</span>
            </div>
            <pre className={styles.message}>{entry.message}</pre>
          </div>
        </div>
      ))}
    </div>
  );
}
