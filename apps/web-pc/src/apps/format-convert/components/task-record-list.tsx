import { Button, Card, Empty, Popconfirm, Space, Table, Toast, Typography } from '@douyinfe/semi-ui';
import {
  FORMAT_CONVERT_FAILED_STATUSES,
  FormatConvertEngine,
  FormatConvertTaskStatus,
  isFormatConvertTaskDeletable,
  type FormatConvertImageInfo,
  type FormatConvertImageSummary,
  type FormatConvertMediaInfo,
  type FormatConvertSummary,
  type FormatConvertTaskItem,
} from '@volix/types';
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { getHttpErrorMessage } from '@/utils/error';
import { downloadFormatConvertResult } from '@/services/format-convert';
import { getPresetLabel, getResolutionDisplay, getVideoCodecDisplay } from '../preset-options';
import { renderFormatConvertTaskStatus } from '../task-status';

interface TaskRecordListProps {
  loading: boolean;
  tasks: FormatConvertTaskItem[];
  onBatchDelete: (taskIds: number[]) => void | Promise<void>;
  onDelete: (task: FormatConvertTaskItem) => void | Promise<void>;
  onRetry: (task: FormatConvertTaskItem) => void;
}

const tableMinWidth = 'max(100%, 980px)';
const detailsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
};
const detailCardStyle = {
  border: '1px solid var(--semi-color-border)',
  borderRadius: 12,
  padding: 12,
  background: 'var(--semi-color-bg-0)',
};
const detailRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  marginTop: 8,
};
const errorBannerStyle = {
  marginBottom: 12,
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid var(--semi-color-danger-light-active)',
  background: 'var(--semi-color-danger-light-default)',
};
const cardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  marginBottom: 16,
  flexWrap: 'wrap',
};
const cardTitleStyle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
  lineHeight: '28px',
  color: 'var(--semi-color-text-0)',
};

const formatDuration = (value?: number) => {
  const totalSeconds = Math.max(0, Math.round(Number(value || 0)));
  if (!totalSeconds) {
    return '';
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const formatBytes = (value?: number) => {
  const size = Number(value || 0);
  if (!size) {
    return '';
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const formatKbps = (value?: number) => {
  const bitrate = Number(value || 0);
  return bitrate ? `${bitrate} kbps` : '';
};

const renderDetailSection = (title: string, rows: Array<{ label: string; value: string }>, emptyText: string) => {
  const validRows = rows.filter(item => item.value);
  return (
    <div style={detailCardStyle}>
      <Typography.Text strong>{title}</Typography.Text>
      {validRows.length === 0 ? (
        <div style={{ marginTop: 8 }}>
          <Typography.Text type="tertiary">{emptyText}</Typography.Text>
        </div>
      ) : (
        validRows.map(item => (
          <div key={`${title}-${item.label}`} style={detailRowStyle}>
            <Typography.Text type="tertiary">{item.label}</Typography.Text>
            <Typography.Text>{item.value}</Typography.Text>
          </div>
        ))
      )}
    </div>
  );
};

const buildMediaInfoRows = (mediaInfo: FormatConvertMediaInfo | undefined, t: (key: string) => string) => {
  return [
    { label: t('formatConvert.record.detail.formatName'), value: mediaInfo?.formatName || '' },
    { label: t('formatConvert.record.detail.duration'), value: formatDuration(mediaInfo?.durationSeconds) },
    { label: t('formatConvert.record.detail.size'), value: formatBytes(mediaInfo?.sizeBytes) },
    { label: t('formatConvert.record.detail.bitRate'), value: formatKbps(mediaInfo?.bitRateKbps) },
    { label: t('formatConvert.record.detail.videoCodec'), value: mediaInfo?.video?.codecName || '' },
    {
      label: t('formatConvert.record.detail.resolution'),
      value:
        mediaInfo?.video?.width && mediaInfo?.video?.height ? `${mediaInfo.video.width}x${mediaInfo.video.height}` : '',
    },
    {
      label: t('formatConvert.record.detail.frameRate'),
      value: mediaInfo?.video?.frameRate ? `${mediaInfo.video.frameRate} fps` : '',
    },
    { label: t('formatConvert.record.detail.videoBitRate'), value: formatKbps(mediaInfo?.video?.bitRateKbps) },
    { label: t('formatConvert.record.detail.audioCodec'), value: mediaInfo?.audio?.codecName || '' },
    {
      label: t('formatConvert.record.detail.sampleRate'),
      value: mediaInfo?.audio?.sampleRateHz ? `${mediaInfo.audio.sampleRateHz} Hz` : '',
    },
    {
      label: t('formatConvert.record.detail.channels'),
      value: mediaInfo?.audio?.channels ? String(mediaInfo.audio.channels) : '',
    },
    { label: t('formatConvert.record.detail.channelLayout'), value: mediaInfo?.audio?.channelLayout || '' },
    { label: t('formatConvert.record.detail.audioBitRate'), value: formatKbps(mediaInfo?.audio?.bitRateKbps) },
  ];
};

const buildConvertSummaryRows = (summary: FormatConvertSummary | undefined, t: (key: string) => string) => {
  return [
    {
      label: t('formatConvert.record.detail.commandMode'),
      value: summary?.commandMode ? t(`formatConvert.record.detail.commandMode.${summary.commandMode}`) : '',
    },
    {
      label: t('formatConvert.record.detail.preset'),
      value: getPresetLabel(summary?.presetId, t),
    },
    { label: t('formatConvert.form.outputFormat'), value: String(summary?.outputFormat || '').toUpperCase() },
    { label: t('formatConvert.form.videoCodec'), value: getVideoCodecDisplay(summary?.videoCodec) },
    { label: t('formatConvert.form.audioCodec'), value: summary?.audioCodec || '' },
    { label: t('formatConvert.form.resolution'), value: getResolutionDisplay(summary?.resolution) },
    { label: t('formatConvert.record.detail.videoBitRate'), value: formatKbps(summary?.videoBitrateKbps) },
    { label: t('formatConvert.record.detail.audioBitRate'), value: formatKbps(summary?.audioBitrateKbps) },
    { label: t('formatConvert.record.detail.crf'), value: summary?.crf ? String(summary.crf) : '' },
    { label: t('formatConvert.record.detail.encodingPreset'), value: summary?.encodingPreset || '' },
    {
      label: t('formatConvert.record.detail.keepAudio'),
      value:
        typeof summary?.keepAudio === 'boolean' ? t(summary.keepAudio ? 'common.toggle.on' : 'common.toggle.off') : '',
    },
    { label: t('formatConvert.record.detail.customArgs'), value: summary?.customArgsText || '' },
  ];
};

const buildImageInfoRows = (info: FormatConvertImageInfo | undefined, t: (key: string) => string) => {
  return [
    { label: t('formatConvert.record.detail.formatName'), value: String(info?.format || '').toUpperCase() },
    {
      label: t('formatConvert.record.detail.resolution'),
      value: info?.width && info?.height ? `${info.width}x${info.height}` : '',
    },
    { label: t('formatConvert.record.detail.size'), value: formatBytes(info?.sizeBytes) },
  ];
};

const buildImageSummaryRows = (summary: FormatConvertImageSummary | undefined, t: (key: string) => string) => {
  return [
    { label: t('formatConvert.form.outputFormat'), value: String(summary?.outputFormat || '').toUpperCase() },
    { label: t('formatConvert.image.form.quality'), value: summary?.quality ? String(summary.quality) : '' },
    { label: t('formatConvert.image.form.width'), value: summary?.width ? String(summary.width) : '' },
  ];
};

export function TaskRecordList(props: TaskRecordListProps) {
  const { loading, tasks, onBatchDelete, onDelete, onRetry } = props;
  const { t } = useI18n();
  const [expandedRowKeys, setExpandedRowKeys] = useState<Array<string | number>>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string | number>>([]);

  const deletableTaskIds = useMemo(
    () => tasks.filter(task => isFormatConvertTaskDeletable(task.status)).map(task => task.id),
    [tasks]
  );

  useEffect(() => {
    setSelectedRowKeys(current => current.filter(item => deletableTaskIds.includes(Number(item))));
  }, [deletableTaskIds]);

  const toggleExpandedRow = (taskId: number) => {
    setExpandedRowKeys(current =>
      current.includes(taskId) ? current.filter(item => item !== taskId) : [...current, taskId]
    );
  };

  const handleBatchDelete = async () => {
    const nextIds = selectedRowKeys.map(item => Number(item)).filter(item => Number.isFinite(item));
    await onBatchDelete(nextIds);
    setSelectedRowKeys([]);
  };

  return (
    <Card shadows="hover" style={{ width: '100%' }} bodyStyle={{ width: '100%' }}>
      <div style={cardHeaderStyle}>
        <h3 style={cardTitleStyle}>{t('formatConvert.record.title')}</h3>
        <Popconfirm
          title={t('formatConvert.record.batchDeleteConfirmTitle')}
          content={t('formatConvert.record.batchDeleteConfirmContent')}
          disabled={!selectedRowKeys.length}
          onConfirm={() => void handleBatchDelete()}
        >
          <Button type="danger" disabled={!selectedRowKeys.length}>
            {selectedRowKeys.length
              ? t('formatConvert.record.batchDeleteWithCount', { count: selectedRowKeys.length })
              : t('formatConvert.record.batchDelete')}
          </Button>
        </Popconfirm>
      </div>

      {tasks.length === 0 ? (
        <Empty title={t('formatConvert.record.emptyTitle')} description={t('formatConvert.record.emptyDescription')} />
      ) : (
        <Table
          loading={loading}
          dataSource={tasks}
          expandedRowKeys={expandedRowKeys}
          rowSelection={{
            selectedRowKeys,
            onChange: (nextSelectedRowKeys?: Array<string | number>) => setSelectedRowKeys(nextSelectedRowKeys || []),
            getCheckboxProps: (record: FormatConvertTaskItem) => ({
              disabled: !isFormatConvertTaskDeletable(record.status),
            }),
          }}
          expandIcon={false}
          onExpand={(expanded, record) => {
            const taskId = record && 'id' in record ? record.id : undefined;
            if (!taskId) {
              return;
            }
            setExpandedRowKeys(current =>
              expanded ? [...new Set([...current, taskId])] : current.filter(item => item !== taskId)
            );
          }}
          expandedRowRender={record =>
            record && 'id' in record ? (
              <div style={{ padding: '4px 0 8px' }}>
                {FORMAT_CONVERT_FAILED_STATUSES.includes(record.status as never) && record.errorMessage ? (
                  <div style={errorBannerStyle}>
                    <Typography.Text strong type="danger">
                      {t('formatConvert.record.detail.errorTitle')}
                    </Typography.Text>
                    <Typography.Text type="danger" style={{ display: 'block', marginTop: 4, wordBreak: 'break-all' }}>
                      {record.errorMessage}
                    </Typography.Text>
                  </div>
                ) : null}
                <div style={detailsGridStyle}>
                  {record.engine === FormatConvertEngine.IMAGE ? (
                    <>
                      {renderDetailSection(
                        t('formatConvert.record.detail.sourceMediaInfo'),
                        buildImageInfoRows(record.sourceImageInfo, t),
                        t('common.status.none')
                      )}
                      {renderDetailSection(
                        t('formatConvert.record.detail.convertSummary'),
                        buildImageSummaryRows(record.imageSummary, t),
                        t('common.status.none')
                      )}
                      {renderDetailSection(
                        t('formatConvert.record.detail.resultMediaInfo'),
                        buildImageInfoRows(record.resultImageInfo, t),
                        t('common.status.none')
                      )}
                    </>
                  ) : (
                    <>
                      {renderDetailSection(
                        t('formatConvert.record.detail.sourceMediaInfo'),
                        buildMediaInfoRows(record.sourceMediaInfo, t),
                        t('common.status.none')
                      )}
                      {renderDetailSection(
                        t('formatConvert.record.detail.convertSummary'),
                        buildConvertSummaryRows(record.convertSummary, t),
                        t('common.status.none')
                      )}
                      {renderDetailSection(
                        t('formatConvert.record.detail.resultMediaInfo'),
                        buildMediaInfoRows(record.resultMediaInfo, t),
                        t('common.status.none')
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : null
          }
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
              render: (_text, record: FormatConvertTaskItem) => (
                <div>
                  {renderFormatConvertTaskStatus(record.status)}
                  {FORMAT_CONVERT_FAILED_STATUSES.includes(record.status as never) && record.errorMessage ? (
                    <Typography.Text
                      type="danger"
                      size="small"
                      ellipsis={{ showTooltip: true }}
                      style={{ display: 'block', marginTop: 4, maxWidth: 220 }}
                    >
                      {record.errorMessage}
                    </Typography.Text>
                  ) : null}
                </div>
              ),
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
                  <Button size="small" onClick={() => toggleExpandedRow(record.id)}>
                    {expandedRowKeys.includes(record.id)
                      ? t('formatConvert.record.hideDetail')
                      : t('formatConvert.record.detail')}
                  </Button>
                  {isFormatConvertTaskDeletable(record.status) ? (
                    <Popconfirm
                      title={t('formatConvert.record.deleteConfirmTitle')}
                      content={t('formatConvert.record.deleteConfirmContent')}
                      onConfirm={() => void onDelete(record)}
                    >
                      <Button size="small" type="danger">
                        {t('formatConvert.record.delete')}
                      </Button>
                    </Popconfirm>
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
