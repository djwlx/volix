import { Button, Input, Notification, Toast, Typography } from '@douyinfe/semi-ui';
import {
  FormatConvertCommandMode,
  FormatConvertMode,
  FormatConvertSourceType,
  FormatConvertTargetType,
} from '@volix/types';
import { IconFolderOpen } from '@douyinfe/semi-icons';
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { createCloudFormatConvertTask, createLocalFormatConvertTask } from '@/services/format-convert';
import { getDisplayErrorMessage } from '@/utils/error';
import {
  getLocalFileSignature,
  mergeLocalFiles,
  removeCloudSelectionEntry,
  type CloudSelectionEntry,
} from '../batch-selection';
import {
  buildFormatConvertCommandPreview,
  buildFormatConvertTargetFileName,
  createFormatConvertDraft,
  getSuggestedTargetFileName,
  isBatchTargetFileNameLocked,
  syncDraftOutputFormatFromFilename,
} from '../preset-options';
import type { ConvertSourceKind } from '../convert-types';
import { attachLocalUploadBeforeUnloadGuard } from './local-upload-before-unload';
import { CloudSourceTree } from './cloud-source-tree';
import { ConvertSettingsForm } from './convert-settings-form';
import { LocalBatchUpload } from './local-batch-upload';
import { OpenlistBrowser } from './openlist-browser';
import { SelectedFileBasket } from './selected-file-basket';
import styles from './workbench.module.scss';

interface MediaConvertPanelProps {
  sourceKind: ConvertSourceKind;
  uploadAccept?: string;
  onCreated: () => void;
}

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

export function MediaConvertPanel(props: MediaConvertPanelProps) {
  const { sourceKind, uploadAccept, onCreated } = props;
  const { t } = useI18n();
  const activeSourceMode: 'local' | 'cloud' = sourceKind === 'local-upload' ? 'local' : 'cloud';
  const [draft, setDraft] = useState(createFormatConvertDraft());
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [cloudSelection, setCloudSelection] = useState<Record<string, CloudSelectionEntry>>({});
  const [cloudTargetDir, setCloudTargetDir] = useState<{ path: string; name: string } | null>(null);
  const [browserMode, setBrowserMode] = useState<'target' | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadEntries, setUploadEntries] = useState<Record<string, LocalUploadEntry>>({});

  const cloudSources = useMemo(() => Object.values(cloudSelection), [cloudSelection]);
  const selectedSourceCount = activeSourceMode === 'local' ? localFiles.length : cloudSources.length;
  const targetFileNameLocked = isBatchTargetFileNameLocked(selectedSourceCount);
  const singleSourceName = activeSourceMode === 'local' ? localFiles[0]?.name || '' : cloudSources[0]?.name || '';
  const previewTargetFileName = buildFormatConvertTargetFileName(
    singleSourceName || 'converted',
    draft,
    targetFileNameLocked
  );
  const previewSourcePath =
    activeSourceMode === 'local'
      ? singleSourceName || '<local-upload-file>'
      : cloudSources[0]?.path || '<openlist-source-file>';
  const previewOutputPath =
    activeSourceMode === 'cloud'
      ? `${cloudTargetDir?.path || '<openlist-target-dir>'}/${previewTargetFileName}`
      : previewTargetFileName;
  const commandPreview = useMemo(
    () => buildFormatConvertCommandPreview(draft, previewSourcePath, previewOutputPath),
    [draft, previewOutputPath, previewSourcePath]
  );
  const disableActions = submitting;

  useEffect(() => {
    if (!submitting || activeSourceMode !== 'local') {
      return;
    }
    return attachLocalUploadBeforeUnloadGuard();
  }, [activeSourceMode, submitting]);

  const updateTargetFileNameForSingleSource = (sourceName: string) => {
    setDraft(current => {
      if (current.targetFileName || !sourceName) {
        return current;
      }
      return {
        ...current,
        targetFileName: getSuggestedTargetFileName(sourceName, current.option.outputFormat),
      };
    });
  };

  const handleAddLocalFiles = (files: File[]) => {
    setUploadEntries({});
    setLocalFiles(current => {
      const next = mergeLocalFiles(current, files);
      if (next.length === 1 && current.length === 0) {
        updateTargetFileNameForSingleSource(next[0]?.name || '');
      }
      return next;
    });
  };

  const handleCloudSelectionChange = (nextSelection: Record<string, CloudSelectionEntry>) => {
    setCloudSelection(nextSelection);
    const nextSources = Object.values(nextSelection);
    if (nextSources.length === 1) {
      updateTargetFileNameForSingleSource(nextSources[0]?.name || '');
    }
  };

  const buildTargetFileName = (sourceName: string) => {
    return buildFormatConvertTargetFileName(sourceName, draft, targetFileNameLocked);
  };

  const handleLocalSubmit = async () => {
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
            commandMode: draft.commandMode,
            presetId: draft.commandMode === FormatConvertCommandMode.PRESET ? draft.presetId : undefined,
            target: {
              type: FormatConvertTargetType.DOWNLOAD,
              fileName: buildTargetFileName(file.name),
            },
            option: draft.option,
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

  const handleCloudSubmit = async () => {
    if (!cloudSources.length) {
      Toast.warning(t('formatConvert.cloud.sourceRequired'));
      return;
    }
    if (!cloudTargetDir) {
      Toast.warning(t('formatConvert.cloud.targetRequired'));
      return;
    }
    if ((cloudTargetDir.path || '').trim() === '/') {
      Toast.warning(t('formatConvert.error.targetRootNotAllowed'));
      return;
    }

    let createdCount = 0;
    let failedCount = 0;
    let firstError: unknown;

    try {
      setSubmitting(true);
      for (const source of cloudSources) {
        try {
          await createCloudFormatConvertTask({
            mode: FormatConvertMode.CLOUD,
            commandMode: draft.commandMode,
            presetId: draft.commandMode === FormatConvertCommandMode.PRESET ? draft.presetId : undefined,
            source: {
              type: FormatConvertSourceType.OPENLIST,
              path: source.path,
              fileName: source.name,
            },
            target: {
              type: FormatConvertTargetType.OPENLIST,
              dirPath: cloudTargetDir.path,
              fileName: buildTargetFileName(source.name),
            },
            option: draft.option,
          });
          createdCount += 1;
        } catch (error) {
          failedCount += 1;
          firstError ||= error;
        }
      }
    } finally {
      setSubmitting(false);
    }

    if (failedCount === 0) {
      Toast.success(
        cloudSources.length > 1
          ? t('formatConvert.cloud.batchCreateSuccess', { count: createdCount })
          : t('formatConvert.cloud.createSuccess')
      );
      setCloudSelection({});
      onCreated();
      return;
    }

    if (createdCount > 0) {
      Toast.warning(
        t('formatConvert.cloud.batchCreatePartial', { successCount: createdCount, failureCount: failedCount })
      );
      onCreated();
      return;
    }

    Toast.error(getDisplayErrorMessage(firstError, t('formatConvert.error.createCloudFailed')));
  };

  const localBasketItems = localFiles.map(file => {
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
  const cloudBasketItems = cloudSources.map(item => ({
    key: item.path,
    primary: item.name,
    secondary: item.path,
  }));
  const localUploadActive = submitting && activeSourceMode === 'local';
  const handleClearSelection = () => {
    if (activeSourceMode === 'local') {
      setLocalFiles([]);
      setUploadEntries({});
      return;
    }
    setCloudSelection({});
  };
  const handleRemoveSelection = (key: string) => {
    if (activeSourceMode === 'local') {
      setLocalFiles(current => current.filter(file => getLocalFileSignature(file) !== key));
      setUploadEntries(current => {
        if (!current[key]) {
          return current;
        }
        const next = { ...current };
        delete next[key];
        return next;
      });
      return;
    }
    setCloudSelection(current => removeCloudSelectionEntry(current, key));
  };
  const modeTitle =
    activeSourceMode === 'cloud'
      ? t('formatConvert.sourcePicker.cloudVideo')
      : t('formatConvert.sourcePicker.localVideo');

  return (
    <>
      <div className={styles.grid}>
        <div className={styles.selectionColumn}>
          <div className={styles.panelShell}>
            <div className={styles.panelHeader}>
              <div className={styles.sectionLabel}>{t('formatConvert.workbench.selectionTitle')}</div>
              <Typography.Title heading={6} style={{ margin: '8px 0 0' }}>
                {modeTitle}
              </Typography.Title>
            </div>

            <div className={styles.stack}>
              {activeSourceMode === 'local' ? (
                <LocalBatchUpload accept={uploadAccept} disabled={disableActions} onSelectFiles={handleAddLocalFiles} />
              ) : (
                <CloudSourceTree
                  disabled={disableActions}
                  selected={cloudSelection}
                  onSelectionChange={handleCloudSelectionChange}
                />
              )}

              <SelectedFileBasket
                clearDisabled={disableActions}
                uploading={localUploadActive}
                items={activeSourceMode === 'local' ? localBasketItems : cloudBasketItems}
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
              {activeSourceMode === 'cloud' ? (
                <div className={styles.summaryItem}>
                  <div className={styles.summaryTitle}>
                    <span className={styles.sectionLabel}>
                      <IconFolderOpen />
                      {t('formatConvert.cloud.targetDir')}
                    </span>
                  </div>
                  <div className={styles.summaryValue}>{cloudTargetDir?.path || t('formatConvert.cloud.noTarget')}</div>
                  <div style={{ marginTop: 12 }}>
                    <Button disabled={disableActions} onClick={() => setBrowserMode('target')}>
                      {t('formatConvert.cloud.pickTarget')}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className={styles.formSection}>
                <ConvertSettingsForm disableActions={disableActions} draft={draft} onChange={setDraft} />
              </div>

              <div className={styles.summaryPanel}>
                <div className={styles.summaryItem}>
                  <div className={styles.summaryTitle}>{t('formatConvert.form.targetFileName')}</div>
                  <div style={{ marginTop: 10 }}>
                    <Input
                      value={
                        targetFileNameLocked
                          ? previewTargetFileName
                          : draft.targetFileName || (singleSourceName ? previewTargetFileName : '')
                      }
                      disabled={disableActions || targetFileNameLocked}
                      placeholder={t('formatConvert.form.targetFileNamePlaceholder')}
                      readonly={targetFileNameLocked}
                      onChange={value =>
                        setDraft(current =>
                          current.commandMode === FormatConvertCommandMode.CUSTOM
                            ? syncDraftOutputFormatFromFilename(current, value)
                            : { ...current, targetFileName: value }
                        )
                      }
                    />
                  </div>
                  {targetFileNameLocked ? (
                    <div className={styles.targetHint}>{t('formatConvert.form.targetFileNameBatchLocked')}</div>
                  ) : null}
                </div>

                <div className={styles.summaryItem}>
                  <div className={styles.summaryTitle}>{t('formatConvert.form.finalCommand')}</div>
                  <div style={{ marginTop: 10 }}>
                    <Input readonly value={commandPreview} />
                  </div>
                </div>

                <div className={styles.summaryItem}>
                  <div className={styles.summaryTitle}>{t('formatConvert.workbench.summaryTitle')}</div>
                  <div className={styles.summaryValue}>
                    {t('formatConvert.workbench.summaryValue', { count: selectedSourceCount })}
                  </div>
                  {activeSourceMode === 'cloud' && cloudTargetDir ? (
                    <div className={styles.targetHint}>
                      {t('formatConvert.workbench.cloudTargetSummary', { path: cloudTargetDir.path })}
                    </div>
                  ) : null}
                </div>

                <div className={styles.footerActions}>
                  <Button
                    theme="solid"
                    disabled={disableActions}
                    loading={submitting && activeSourceMode === 'cloud'}
                    onClick={() => void (activeSourceMode === 'local' ? handleLocalSubmit() : handleCloudSubmit())}
                  >
                    {activeSourceMode === 'local' ? t('formatConvert.local.submit') : t('formatConvert.cloud.submit')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <OpenlistBrowser
        open={browserMode === 'target'}
        selectMode="dir"
        title={t('formatConvert.cloud.pickTarget')}
        onCancel={() => setBrowserMode('')}
        onSelect={item => {
          setCloudTargetDir(item);
          setBrowserMode('');
        }}
      />
    </>
  );
}
