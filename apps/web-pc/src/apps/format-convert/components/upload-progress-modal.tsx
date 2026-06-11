import { Modal, Progress, Space, Typography } from '@douyinfe/semi-ui';
import { useI18n } from '@/i18n';

interface UploadProgressModalProps {
  visible: boolean;
  percent: number;
  fileName: string;
}

export function UploadProgressModal(props: UploadProgressModalProps) {
  const { visible, percent, fileName } = props;
  const { t } = useI18n();

  return (
    <Modal
      visible={visible}
      footer={null}
      closable={false}
      maskClosable={false}
      width={440}
      bodyStyle={{ padding: 24 }}
      title={t('formatConvert.upload.title')}
    >
      <Space vertical align="start" style={{ width: '100%' }} spacing={18}>
        <Typography.Text type="tertiary">{t('formatConvert.upload.subtitle')}</Typography.Text>

        <div
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 12,
            background: 'var(--semi-color-fill-0)',
            border: '1px solid var(--semi-color-border)',
            boxSizing: 'border-box',
          }}
        >
          <Typography.Text
            strong
            ellipsis={{ showTooltip: true }}
            style={{ display: 'block', maxWidth: '100%', wordBreak: 'break-all' }}
          >
            {fileName}
          </Typography.Text>
        </div>

        <div style={{ width: '100%', textAlign: 'center' }}>
          <div
            style={{
              fontSize: 34,
              fontWeight: 700,
              lineHeight: '40px',
              color: 'var(--semi-color-text-0)',
            }}
          >
            {percent}%
          </div>
          <Typography.Text type="tertiary">{t('formatConvert.upload.progressLabel')}</Typography.Text>
        </div>

        <div style={{ width: '100%' }}>
          <Progress percent={percent} showInfo={false} />
        </div>

        <div
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 12,
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.16)',
            boxSizing: 'border-box',
          }}
        >
          <Typography.Text>{t('formatConvert.upload.leavePageHint')}</Typography.Text>
        </div>
      </Space>
    </Modal>
  );
}
