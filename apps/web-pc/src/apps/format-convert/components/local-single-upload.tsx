import { Upload } from '@douyinfe/semi-ui';
import { IconUpload } from '@douyinfe/semi-icons';
import { useI18n } from '@/i18n';
import styles from './workbench.module.scss';

interface LocalSingleUploadProps {
  disabled?: boolean;
  accept?: string;
  onSelectFile: (file: File | null) => void;
}

export function LocalSingleUpload(props: LocalSingleUploadProps) {
  const { disabled, accept, onSelectFile } = props;
  const { t } = useI18n();

  return (
    <div className={styles.uploadSurface}>
      <Upload
        action=""
        accept={accept}
        beforeUpload={() => false}
        disabled={disabled}
        dragIcon={<IconUpload size="extra-large" />}
        dragMainText={t('formatConvert.comic.uploadTitle')}
        dragSubText={t('formatConvert.comic.uploadSubtitle')}
        draggable
        multiple={false}
        prompt={
          <div className={styles.uploadPrompt}>
            <span className={styles.uploadPromptTitle}>{t('formatConvert.comic.uploadPrompt')}</span>
            <span className={styles.uploadPromptText}>{t('formatConvert.comic.uploadPromptDescription')}</span>
            <span className={styles.uploadPromptMeta}>{t('formatConvert.comic.uploadPromptHint')}</span>
          </div>
        }
        showUploadList={false}
        uploadTrigger="custom"
        onFileChange={files => onSelectFile(files?.[0] || null)}
      />
    </div>
  );
}
