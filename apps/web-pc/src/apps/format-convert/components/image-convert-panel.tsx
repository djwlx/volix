import { Button, Notification, Toast, Typography } from '@douyinfe/semi-ui';
import { FormatConvertCommandMode, FormatConvertEngine, FormatConvertTargetType } from '@volix/types';
import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { createLocalFormatConvertTask } from '@/services/format-convert';
import { getDisplayErrorMessage } from '@/utils/error';
import { getLocalFileSignature, mergeLocalFiles } from '../batch-selection';
import { buildImageTargetFileName, createImageConvertDraft } from '../image-options';
import { attachLocalUploadBeforeUnloadGuard } from './local-upload-before-unload';
import { ImageConvertSettingsForm } from './image-convert-settings-form';
import { LocalBatchUpload } from './local-batch-upload';
import { SelectedFileBasket } from './selected-file-basket';
import styles from './workbench.module.scss';

type LocalUploadStatus = 'pending' | 'uploading' | 'success' | 'error';

interface LocalUploadEntry {
  status: LocalUploadStatus;
  percent: number;
}

const formatLocalFileMeta = (file: File) => {
  const size =
    file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : `${Math.ceil(file.size / 1024)} KB`;
  return `${file.type || 'application/octet-stream'} · ${size}`;
};

interface ImageConvertPanelProps {
  onCreated: () => void;
}

export function ImageConvertPanel(props: ImageConvertPanelProps) {
  const { onCreated } = props;
  const { t } = useI18n();
  const [draft, setDraft] = useState(createImageConvertDraft());
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadEntries, setUploadEntries] = useState<Record<string, LocalUploadEntry>>({});

  useEffect(() => {
    if (!submitting) {
      return;
    }
    return attachLocalUploadBeforeUnloadGuard();
  }, [submitting]);

  const handleAddLocalFiles = (files: File[]) => {
    setUploadEntries({});
    setLocalFiles(current => mergeLocalFiles(current, files));
  };

  const handleSubmit = async () => {
    if (!localFiles.length) {
      Toast.warning(t('formatConvert.local.fileRequired'));
      return;
    }

    let createdCount = 0;
    let failedCount = 0;
    let firstError: unknown;

    setSubmitting(true);
    setUploadEntries(
      localFiles.reduce<Record<string, LocalUploadEntry>>((acc, file) => {
        acc[getLocalFileSignature(file)] = { status: 'pending', percent: 0 };
        return acc;
      }, {})
    );

    for (const file of localFiles) {
      const signature = getLocalFileSignature(file);
      try {
        setUploadEntries(current => ({ ...current, [signature]: { status: 'uploading', percent: 0 } }));
        await createLocalFormatConvertTask(
          file,
          {
            engine: FormatConvertEngine.IMAGE,
            commandMode: FormatConvertCommandMode.PRESET,
            imageOption: draft.option,
            target: {
              type: FormatConvertTargetType.DOWNLOAD,
              fileName: buildImageTargetFileName(file.name, draft.option.outputFormat),
            },
          },
          {
            onUploadProgress: percent => {
              setUploadEntries(current => {
                const previous = current[signature]?.percent ?? 0;
                return {
                  ...current,
                  [signature]: { status: 'uploading', percent: percent > previous ? percent : previous },
                };
              });
            },
          }
        );
        setUploadEntries(current => ({ ...current, [signature]: { status: 'success', percent: 100 } }));
        createdCount += 1;
      } catch (error) {
        setUploadEntries(current => ({
          ...current,
          [signature]: { status: 'error', percent: current[signature]?.percent ?? 0 },
        }));
        failedCount += 1;
        firstError ||= error;
      }
    }

    setSubmitting(false);

    if (createdCount > 0) {
      Notification.success({
        title: t('formatConvert.upload.completedNotifyTitle'),
        content: t('formatConvert.upload.completedNotifyContent'),
        duration: 6,
      });
      if (failedCount > 0) {
        Toast.warning(
          t('formatConvert.local.batchCreatePartial', { successCount: createdCount, failureCount: failedCount })
        );
      }
      onCreated();
      return;
    }

    Toast.error(getDisplayErrorMessage(firstError, t('formatConvert.error.createLocalFailed')));
  };

  const basketItems = localFiles.map(file => {
    const signature = getLocalFileSignature(file);
    const entry = uploadEntries[signature];
    return {
      key: signature,
      primary: file.name,
      secondary: formatLocalFileMeta(file),
      uploadStatus: entry?.status,
      uploadPercent: entry?.percent,
    };
  });

  const handleClearSelection = () => {
    setLocalFiles([]);
    setUploadEntries({});
  };
  const handleRemoveSelection = (key: string) => {
    setLocalFiles(current => current.filter(file => getLocalFileSignature(file) !== key));
    setUploadEntries(current => {
      if (!current[key]) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  return (
    <div className={styles.grid}>
      <div className={styles.selectionColumn}>
        <div className={styles.panelShell}>
          <div className={styles.panelHeader}>
            <div className={styles.sectionLabel}>{t('formatConvert.workbench.selectionTitle')}</div>
            <Typography.Title heading={6} style={{ margin: '8px 0 0' }}>
              {t('formatConvert.sourcePicker.localImage')}
            </Typography.Title>
          </div>

          <div className={styles.stack}>
            <LocalBatchUpload accept="image/*" disabled={submitting} onSelectFiles={handleAddLocalFiles} />
            <SelectedFileBasket
              clearDisabled={submitting}
              uploading={submitting}
              items={basketItems}
              onClear={handleClearSelection}
              onRemove={handleRemoveSelection}
            />
          </div>
        </div>
      </div>

      <div className={styles.actionColumn}>
        <div className={styles.panelShellStrong}>
          <div className={styles.panelHeader}>
            <div className={styles.sectionLabel}>{t('formatConvert.workbench.outputTitle')}</div>
            <Typography.Title heading={6} style={{ margin: '8px 0 0' }}>
              {t('formatConvert.workbench.summaryTitle')}
            </Typography.Title>
          </div>

          <div className={styles.stack}>
            <div className={styles.formSection}>
              <ImageConvertSettingsForm disableActions={submitting} draft={draft} onChange={setDraft} />
            </div>

            <div className={styles.summaryPanel}>
              <div className={styles.summaryItem}>
                <div className={styles.summaryTitle}>{t('formatConvert.workbench.summaryTitle')}</div>
                <div className={styles.summaryValue}>
                  {t('formatConvert.workbench.summaryValue', { count: localFiles.length })}
                </div>
              </div>

              <div className={styles.footerActions}>
                <Button theme="solid" disabled={submitting} loading={submitting} onClick={() => void handleSubmit()}>
                  {t('formatConvert.local.submit')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
