import { Button, Card, Empty, Space, Table, Toast, Typography } from '@douyinfe/semi-ui';
import { FORMAT_CONVERT_FAILED_STATUSES, FormatConvertTaskStatus, type FormatConvertTaskItem } from '@volix/types';
import { useI18n } from '@/i18n';
import { getHttpErrorMessage } from '@/utils/error';
import { downloadFormatConvertResult } from '@/services/format-convert';
import { renderFormatConvertTaskStatus } from '../task-status';

interface TaskRecordListProps {
  loading: boolean;
  tasks: FormatConvertTaskItem[];
  onCleanup: (task: FormatConvertTaskItem) => void;
  onRetry: (task: FormatConvertTaskItem) => void;
}

const tableMinWidth = 'max(100%, 980px)';

const hasLocalArtifacts = (task: FormatConvertTaskItem) => {
  return Boolean(
    task.workspaceDir ||
      task.sourceLocalPath ||
      task.outputLocalPath ||
      task.logLocalPath ||
      task.resultLocalPath ||
      (task.source.type === 'upload' && task.source.uploadPath)
  );
};

export function TaskRecordList(props: TaskRecordListProps) {
  const { loading, tasks, onCleanup, onRetry } = props;
  const { t } = useI18n();

  return (
    <Card
      title={t('formatConvert.record.title')}
      shadows="hover"
      style={{ width: '100%' }}
      bodyStyle={{ width: '100%' }}
    >
      {tasks.length === 0 ? (
        <Empty title={t('formatConvert.record.emptyTitle')} description={t('formatConvert.record.emptyDescription')} />
      ) : (
        <Table
          loading={loading}
          dataSource={tasks}
          pagination={false}
          rowKey="id"
          style={{ width: '100%' }}
          size="small"
          tableLayout="fixed"
          scroll={{ x: tableMinWidth }}
          columns={[
            {
              title: t('formatConvert.record.source'),
              dataIndex: 'source',
              render: (_text, record: FormatConvertTaskItem) => (
                <div>
                  <Typography.Text strong>{record.source.fileName}</Typography.Text>
                  <div>{record.mode}</div>
                </div>
              ),
            },
            {
              title: t('formatConvert.record.target'),
              dataIndex: 'target',
              render: (_text, record: FormatConvertTaskItem) => (
                <div>{record.target.type === 'openlist' ? record.target.dirPath : record.target.fileName}</div>
              ),
            },
            {
              title: t('formatConvert.record.status'),
              dataIndex: 'status',
              render: (_text, record: FormatConvertTaskItem) => renderFormatConvertTaskStatus(record.status),
            },
            {
              title: t('formatConvert.record.updatedAt'),
              dataIndex: 'updatedAt',
              render: (_text, record: FormatConvertTaskItem) => record.updatedAt || '-',
            },
            {
              title: t('formatConvert.record.action'),
              render: (_text, record: FormatConvertTaskItem) => (
                <Space>
                  {record.status === FormatConvertTaskStatus.COMPLETED && record.resultLocalPath ? (
                    <Button
                      size="small"
                      theme="solid"
                      onClick={async () => {
                        try {
                          await downloadFormatConvertResult(record.id);
                        } catch (error) {
                          Toast.error(getHttpErrorMessage(error, t('common.error.requestFailed')));
                        }
                      }}
                    >
                      {t('formatConvert.record.download')}
                    </Button>
                  ) : null}
                  {FORMAT_CONVERT_FAILED_STATUSES.includes(record.status as never) ? (
                    <Button size="small" onClick={() => onRetry(record)}>
                      {t('formatConvert.record.retry')}
                    </Button>
                  ) : null}
                  {record.status === FormatConvertTaskStatus.COMPLETED && hasLocalArtifacts(record) ? (
                    <Button size="small" type="danger" onClick={() => onCleanup(record)}>
                      {t('formatConvert.record.cleanup')}
                    </Button>
                  ) : null}
                </Space>
              ),
            },
          ]}
        />
      )}
    </Card>
  );
}
