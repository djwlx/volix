import { Upload } from '@douyinfe/semi-ui';
import { IconUpload } from '@douyinfe/semi-icons';
import { useI18n } from '@/i18n';
import styles from './workbench.module.scss';

interface LocalBatchUploadProps {
  disabled?: boolean;
  accept?: string;
  onSelectFiles: (files: File[]) => void;
}

export function LocalBatchUpload(props: LocalBatchUploadProps) {
  const { disabled, accept, onSelectFiles } = props;
  const { t } = useI18n();

  return (
    <div className={styles.uploadSurface}>
      <Upload
        action=""
        accept={accept || 'video/*,audio/*'}
        beforeUpload={() => false}
        disabled={disabled}
        dragIcon={<IconUpload size="extra-large" />}
        dragMainText={t('formatConvert.local.uploadTitle')}
        dragSubText={t('formatConvert.local.uploadSubtitle')}
        draggable
        multiple
        prompt={
          <div className={styles.uploadPrompt}>
            <span className={styles.uploadPromptTitle}>{t('formatConvert.local.uploadPrompt')}</span>
            <span className={styles.uploadPromptText}>{t('formatConvert.local.uploadPromptDescription')}</span>
            <span className={styles.uploadPromptMeta}>{t('formatConvert.local.uploadPromptHint')}</span>
          </div>
        }
        showUploadList={false}
        uploadTrigger="custom"
        onFileChange={files => onSelectFiles(files || [])}
      />
    </div>
  );
}
