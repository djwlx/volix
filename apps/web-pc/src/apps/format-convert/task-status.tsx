import { Tag } from '@douyinfe/semi-ui';
import type { FormatConvertTaskStatus } from '@volix/types';
import { translateClient } from '@/i18n';

const STATUS_META_MAP: Record<
  FormatConvertTaskStatus,
  {
    tone: 'blue' | 'cyan' | 'amber' | 'red' | 'green' | 'grey';
    messageId: string;
  }
> = {
  pending: { tone: 'blue', messageId: 'formatConvert.status.pending' },
  downloading: { tone: 'cyan', messageId: 'formatConvert.status.downloading' },
  download_failed: { tone: 'red', messageId: 'formatConvert.status.downloadFailed' },
  converting: { tone: 'amber', messageId: 'formatConvert.status.converting' },
  convert_failed: { tone: 'red', messageId: 'formatConvert.status.convertFailed' },
  uploading: { tone: 'cyan', messageId: 'formatConvert.status.uploading' },
  upload_failed: { tone: 'red', messageId: 'formatConvert.status.uploadFailed' },
  completed: { tone: 'green', messageId: 'formatConvert.status.completed' },
  canceled: { tone: 'grey', messageId: 'formatConvert.status.canceled' },
};

export const getTaskStatusView = (status: FormatConvertTaskStatus) => {
  const meta = STATUS_META_MAP[status];
  return {
    ...meta,
    text: translateClient(meta.messageId),
  };
};

export function renderFormatConvertTaskStatus(status: FormatConvertTaskStatus) {
  const view = getTaskStatusView(status);
  return (
    <Tag color={view.tone} size="small" shape="circle">
      {view.text}
    </Tag>
  );
}
