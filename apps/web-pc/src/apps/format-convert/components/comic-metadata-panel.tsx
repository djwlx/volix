import { Button, Notification, Toast, Typography } from '@douyinfe/semi-ui';
import { FormatConvertCommandMode, FormatConvertEngine, FormatConvertTargetType } from '@volix/types';
import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { analyzeLocalComicFile, createLocalFormatConvertTask } from '@/services/format-convert';
import { getDisplayErrorMessage } from '@/utils/error';
import { getLocalFileSignature } from '../batch-selection';
import { buildComicTargetFileName, createComicMetadataDraft, hydrateComicMetadataDraft } from '../comic-metadata';
import { attachLocalUploadBeforeUnloadGuard } from './local-upload-before-unload';
import { ComicMetadataForm } from './comic-metadata-form';
import { LocalSingleUpload } from './local-single-upload';
import { SelectedFileBasket } from './selected-file-basket';
import styles from './workbench.module.scss';

interface ComicMetadataPanelProps {
  onCreated: () => void;
}

const formatLocalFileMeta = (file: File) => {
  const size =
    file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : `${Math.ceil(file.size / 1024)} KB`;
  return `${file.type || 'application/zip'} · ${size}`;
};

export function ComicMetadataPanel(props: ComicMetadataPanelProps) {
  const { onCreated } = props;
  const { t } = useI18n();
  const [draft, setDraft] = useState(createComicMetadataDraft());
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!submitting) {
      return;
    }
    return attachLocalUploadBeforeUnloadGuard();
  }, [submitting]);

  useEffect(() => {
    if (!localFile) {
      setDraft(createComicMetadataDraft());
      return;
    }

    let canceled = false;

    const run = async () => {
      try {
        setAnalyzing(true);
        const response = await analyzeLocalComicFile(localFile);
        if (!canceled) {
          setDraft(hydrateComicMetadataDraft(response.data?.analysis));
        }
      } catch (error) {
        if (!canceled) {
          setDraft(createComicMetadataDraft());
          Toast.error(getDisplayErrorMessage(error, t('formatConvert.error.analyzeComicFailed')));
        }
      } finally {
        if (!canceled) {
          setAnalyzing(false);
        }
      }
    };

    void run();

    return () => {
      canceled = true;
    };
  }, [localFile, t]);

  const handleSubmit = async () => {
    if (!localFile) {
      Toast.warning(t('formatConvert.comic.fileRequired'));
      return;
    }

    try {
      setSubmitting(true);
      await createLocalFormatConvertTask(localFile, {
        engine: FormatConvertEngine.COMIC,
        commandMode: FormatConvertCommandMode.PRESET,
        comicOption: {
          metadata: draft.metadata,
          normalizeExtension: true,
          mergeStrategy: 'merge',
        },
        target: {
          type: FormatConvertTargetType.DOWNLOAD,
          fileName: buildComicTargetFileName(localFile.name),
        },
      });
      Notification.success({
        title: t('formatConvert.upload.completedNotifyTitle'),
        content: t('formatConvert.upload.completedNotifyContent'),
        duration: 6,
      });
      onCreated();
    } catch (error) {
      Toast.error(getDisplayErrorMessage(error, t('formatConvert.error.createLocalFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  const basketItems = localFile
    ? [
        {
          key: getLocalFileSignature(localFile),
          primary: localFile.name,
          secondary: formatLocalFileMeta(localFile),
        },
      ]
    : [];

  return (
    <div className={styles.grid}>
      <div className={styles.selectionColumn}>
        <div className={styles.panelShell}>
          <div className={styles.panelHeader}>
            <div className={styles.sectionLabel}>{t('formatConvert.workbench.selectionTitle')}</div>
            <Typography.Title heading={6} style={{ margin: '8px 0 0' }}>
              {t('formatConvert.sourcePicker.localComicMetadata')}
            </Typography.Title>
          </div>

          <div className={styles.stack}>
            <LocalSingleUpload
              accept=".cbz,.zip,application/zip"
              disabled={submitting || analyzing}
              onSelectFile={setLocalFile}
            />
            <SelectedFileBasket
              clearDisabled={submitting || analyzing}
              items={basketItems}
              onClear={() => setLocalFile(null)}
              onRemove={() => setLocalFile(null)}
            />
          </div>
        </div>
      </div>

      <div className={styles.actionColumn}>
        <div className={styles.panelShellStrong}>
          <div className={styles.panelHeader}>
            <div className={styles.sectionLabel}>{t('formatConvert.workbench.outputTitle')}</div>
            <Typography.Title heading={6} style={{ margin: '8px 0 0' }}>
              {t('formatConvert.comic.form.titleBlock')}
            </Typography.Title>
          </div>

          <div className={styles.stack}>
            <div className={styles.formSection}>
              <ComicMetadataForm disableActions={submitting || analyzing} draft={draft} onChange={setDraft} />
            </div>

            <div className={styles.summaryPanel}>
              <div className={styles.summaryItem}>
                <div className={styles.summaryTitle}>{t('formatConvert.comic.resultFileName')}</div>
                <div className={styles.summaryValue}>
                  {localFile ? buildComicTargetFileName(localFile.name) : t('common.status.none')}
                </div>
              </div>

              <div className={styles.footerActions}>
                <Button
                  theme="solid"
                  disabled={submitting || analyzing}
                  loading={submitting || analyzing}
                  onClick={() => void handleSubmit()}
                >
                  {t('formatConvert.comic.submit')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
