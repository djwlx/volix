import { Button, Card, Input, Select, Space, Toast, Typography } from '@douyinfe/semi-ui';
import {
  FormatConvertCommandMode,
  FormatConvertMode,
  FormatConvertSourceType,
  FormatConvertTargetType,
} from '@volix/types';
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { createCloudFormatConvertTask, createLocalFormatConvertTask } from '@/services/format-convert';
import { getHttpErrorMessage } from '@/utils/error';
import {
  applyCommandModeToDraft,
  applyPresetToDraft,
  buildAudioCodecOptions,
  buildFormatConvertCommandPreview,
  buildFormatOptions,
  buildPresetOptions,
  buildResolutionOptions,
  buildVideoCodecOptions,
  createCloudTaskPayload,
  createFormatConvertDraft,
  getSuggestedTargetFileName,
  replaceTargetFileExtension,
  syncDraftOutputFormatFromFilename,
  type FormatConvertSourceMode,
} from '../preset-options';
import { attachLocalUploadBeforeUnloadGuard } from './local-upload-before-unload';
import { OpenlistBrowser } from './openlist-browser';
import { UploadProgressModal } from './upload-progress-modal';

interface ConvertTaskCardProps {
  onCreated: () => void;
}

const SelectAny = Select as any;

export function ConvertTaskCard(props: ConvertTaskCardProps) {
  const { onCreated } = props;
  const { t } = useI18n();
  const [sourceMode, setSourceMode] = useState<FormatConvertSourceMode>('local');
  const [draft, setDraft] = useState(createFormatConvertDraft());
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [cloudSource, setCloudSource] = useState<{ path: string; name: string } | null>(null);
  const [cloudTargetDir, setCloudTargetDir] = useState<{ path: string; name: string } | null>(null);
  const [browserMode, setBrowserMode] = useState<'source' | 'target' | ''>('');
  const [cloudSubmitting, setCloudSubmitting] = useState(false);
  const [localUploading, setLocalUploading] = useState(false);
  const [localUploadProgress, setLocalUploadProgress] = useState(0);

  const presetOptions = buildPresetOptions(FormatConvertMode.LOCAL);
  const formatOptions = buildFormatOptions();
  const videoCodecOptions = buildVideoCodecOptions(draft.option.outputFormat);
  const audioCodecOptions = buildAudioCodecOptions();
  const resolutionOptions = buildResolutionOptions();

  const sourceName = sourceMode === 'local' ? localFile?.name || '' : cloudSource?.name || '';
  const resolvedTargetFileName =
    draft.targetFileName || getSuggestedTargetFileName(sourceName || 'converted', draft.option.outputFormat);
  const previewSourcePath =
    sourceMode === 'local' ? sourceName || '<local-upload-file>' : cloudSource?.path || '<openlist-source-file>';
  const previewOutputPath =
    sourceMode === 'local'
      ? resolvedTargetFileName
      : `${cloudTargetDir?.path || '<openlist-target-dir>'}/${resolvedTargetFileName}`;
  const commandPreview = useMemo(
    () => buildFormatConvertCommandPreview(draft, previewSourcePath, previewOutputPath),
    [draft, previewOutputPath, previewSourcePath]
  );
  const disableActions = cloudSubmitting || localUploading;

  useEffect(() => {
    if (!localUploading) {
      return;
    }
    return attachLocalUploadBeforeUnloadGuard();
  }, [localUploading]);

  const handleSourceModeChange = (nextMode: FormatConvertSourceMode) => {
    setSourceMode(nextMode);
    if (nextMode === 'local') {
      setCloudSource(null);
      setCloudTargetDir(null);
      return;
    }
    setLocalFile(null);
  };

  const handleLocalSubmit = async () => {
    if (!localFile) {
      Toast.warning(t('formatConvert.local.fileRequired'));
      return;
    }

    try {
      setLocalUploading(true);
      setLocalUploadProgress(0);
      await createLocalFormatConvertTask(
        localFile,
        {
          commandMode: draft.commandMode,
          presetId: draft.commandMode === FormatConvertCommandMode.PRESET ? draft.presetId : undefined,
          target: {
            type: FormatConvertTargetType.DOWNLOAD,
            fileName: resolvedTargetFileName,
          },
          option: draft.option,
        },
        {
          onUploadProgress: percent => {
            setLocalUploadProgress(current => (percent > current ? percent : current));
          },
        }
      );
      setLocalUploadProgress(100);
      Toast.success(t('formatConvert.local.createSuccess'));
      onCreated();
    } catch (error) {
      const fallback = t('formatConvert.error.createLocalFailed');
      const message = error instanceof Error ? error.message || fallback : getHttpErrorMessage(error, fallback);
      Toast.error(message);
    } finally {
      setLocalUploading(false);
    }
  };

  const handleCloudSubmit = async () => {
    if (!cloudSource) {
      Toast.warning(t('formatConvert.cloud.sourceRequired'));
      return;
    }
    if (!cloudTargetDir) {
      Toast.warning(t('formatConvert.cloud.targetRequired'));
      return;
    }

    try {
      setCloudSubmitting(true);
      await createCloudFormatConvertTask({
        ...createCloudTaskPayload(cloudSource.path, cloudSource.name, cloudTargetDir.path, {
          ...draft,
          targetFileName: resolvedTargetFileName,
        }),
        source: {
          type: FormatConvertSourceType.OPENLIST,
          path: cloudSource.path,
          fileName: cloudSource.name,
        },
        target: {
          type: FormatConvertTargetType.OPENLIST,
          dirPath: cloudTargetDir.path,
          fileName: resolvedTargetFileName,
        },
      });
      Toast.success(t('formatConvert.cloud.createSuccess'));
      onCreated();
    } catch (error) {
      const fallback = t('formatConvert.error.createCloudFailed');
      const message = error instanceof Error ? error.message || fallback : getHttpErrorMessage(error, fallback);
      Toast.error(message);
    } finally {
      setCloudSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (sourceMode === 'local') {
      await handleLocalSubmit();
      return;
    }
    await handleCloudSubmit();
  };

  return (
    <Card title={t('route.formatConvert.title')} shadows="hover">
      <Space vertical align="start" style={{ width: '100%' }} spacing={20}>
        <div style={{ width: '100%' }}>
          <Typography.Text strong>{t('formatConvert.form.sourceMode')}</Typography.Text>
          <SelectAny
            value={sourceMode}
            style={{ width: '100%', marginTop: 8 }}
            disabled={disableActions}
            optionList={
              [
                { label: t('formatConvert.form.sourceModeLocal'), value: 'local' },
                { label: t('formatConvert.form.sourceModeCloud'), value: 'cloud' },
              ] as any
            }
            onChange={(value: unknown) => handleSourceModeChange(String(value || 'local') as FormatConvertSourceMode)}
          />
        </div>

        {sourceMode === 'local' ? (
          <div style={{ width: '100%' }}>
            <Typography.Text strong>{t('formatConvert.local.selectedFile')}</Typography.Text>
            <div style={{ marginTop: 8, marginBottom: 12 }}>{localFile?.name || t('formatConvert.local.noFile')}</div>
            <input
              type="file"
              accept="video/*,audio/*"
              disabled={disableActions}
              onChange={event => {
                const nextFile = event.target.files?.[0] || null;
                setLocalFile(nextFile);
                if (nextFile) {
                  setDraft(current => ({
                    ...current,
                    targetFileName:
                      current.targetFileName || getSuggestedTargetFileName(nextFile.name, current.option.outputFormat),
                  }));
                }
              }}
            />
          </div>
        ) : (
          <>
            <div style={{ width: '100%' }}>
              <Typography.Text strong>{t('formatConvert.cloud.sourceFile')}</Typography.Text>
              <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 8 }}>
                <span>{cloudSource?.path || t('formatConvert.cloud.noSource')}</span>
                <Button disabled={disableActions} onClick={() => setBrowserMode('source')}>
                  {t('formatConvert.cloud.pickSource')}
                </Button>
              </Space>
            </div>
            <div style={{ width: '100%' }}>
              <Typography.Text strong>{t('formatConvert.cloud.targetDir')}</Typography.Text>
              <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 8 }}>
                <span>{cloudTargetDir?.path || t('formatConvert.cloud.noTarget')}</span>
                <Button disabled={disableActions} onClick={() => setBrowserMode('target')}>
                  {t('formatConvert.cloud.pickTarget')}
                </Button>
              </Space>
            </div>
          </>
        )}

        <div style={{ width: '100%' }}>
          <Typography.Text strong>{t('formatConvert.form.commandMode')}</Typography.Text>
          <SelectAny
            value={draft.commandMode}
            style={{ width: '100%', marginTop: 8 }}
            disabled={disableActions}
            optionList={
              [
                { label: t('formatConvert.form.commandModePreset'), value: FormatConvertCommandMode.PRESET },
                { label: t('formatConvert.form.commandModeCustom'), value: FormatConvertCommandMode.CUSTOM },
              ] as any
            }
            onChange={(value: unknown) =>
              setDraft(current => applyCommandModeToDraft(current, value as FormatConvertCommandMode))
            }
          />
        </div>

        {draft.commandMode === FormatConvertCommandMode.PRESET ? (
          <div style={{ width: '100%' }}>
            <Typography.Text strong>{t('formatConvert.form.preset')}</Typography.Text>
            <SelectAny
              value={draft.presetId}
              style={{ width: '100%', marginTop: 8 }}
              disabled={disableActions}
              optionList={
                presetOptions.map(item => ({
                  label: t(item.labelKey),
                  value: item.value,
                })) as any
              }
              onChange={(value: unknown) =>
                setDraft(current => {
                  const nextDraft = applyPresetToDraft(current, String(value || ''));
                  return {
                    ...nextDraft,
                    targetFileName: current.targetFileName
                      ? replaceTargetFileExtension(current.targetFileName, nextDraft.option.outputFormat)
                      : getSuggestedTargetFileName(sourceName || 'converted', nextDraft.option.outputFormat),
                  };
                })
              }
            />
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ width: '100%' }}>
                <Typography.Text strong>{t('formatConvert.form.outputFormat')}</Typography.Text>
                <SelectAny
                  value={draft.option.outputFormat}
                  style={{ width: '100%', marginTop: 8 }}
                  disabled={disableActions}
                  optionList={formatOptions as any}
                  onChange={(value: unknown) =>
                    setDraft(current => {
                      const outputFormat = String(value || 'mp4') as never;
                      const nextVideoCodecOptions = buildVideoCodecOptions(String(outputFormat));
                      const nextVideoCodec = nextVideoCodecOptions.some(
                        item => item.value === current.option.videoCodec
                      )
                        ? current.option.videoCodec
                        : nextVideoCodecOptions[0]?.value;
                      return {
                        ...current,
                        option: {
                          ...current.option,
                          outputFormat,
                          videoCodec: nextVideoCodec,
                          resolution: nextVideoCodecOptions.length ? current.option.resolution : 'source',
                        },
                        targetFileName: current.targetFileName
                          ? replaceTargetFileExtension(current.targetFileName, String(outputFormat))
                          : getSuggestedTargetFileName(sourceName || 'converted', String(outputFormat)),
                      };
                    })
                  }
                />
              </div>

              {videoCodecOptions.length > 0 ? (
                <div style={{ width: '100%' }}>
                  <Typography.Text strong>{t('formatConvert.form.videoCodec')}</Typography.Text>
                  <SelectAny
                    value={draft.option.videoCodec}
                    style={{ width: '100%', marginTop: 8 }}
                    disabled={disableActions}
                    optionList={videoCodecOptions as any}
                    onChange={(value: unknown) =>
                      setDraft(current => ({
                        ...current,
                        option: {
                          ...current.option,
                          videoCodec: String(value || ''),
                        },
                      }))
                    }
                  />
                </div>
              ) : null}

              <div style={{ width: '100%' }}>
                <Typography.Text strong>{t('formatConvert.form.audioCodec')}</Typography.Text>
                <SelectAny
                  value={draft.option.audioCodec}
                  style={{ width: '100%', marginTop: 8 }}
                  disabled={disableActions}
                  optionList={audioCodecOptions as any}
                  onChange={(value: unknown) =>
                    setDraft(current => ({
                      ...current,
                      option: {
                        ...current.option,
                        audioCodec: String(value || ''),
                      },
                    }))
                  }
                />
              </div>

              {videoCodecOptions.length > 0 ? (
                <div style={{ width: '100%' }}>
                  <Typography.Text strong>{t('formatConvert.form.resolution')}</Typography.Text>
                  <SelectAny
                    value={draft.option.resolution}
                    style={{ width: '100%', marginTop: 8 }}
                    disabled={disableActions}
                    optionList={resolutionOptions as any}
                    onChange={(value: unknown) =>
                      setDraft(current => ({
                        ...current,
                        option: {
                          ...current.option,
                          resolution: String(value || 'source') as never,
                        },
                      }))
                    }
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 12,
                background: 'rgba(14, 165, 233, 0.08)',
                border: '1px solid rgba(14, 165, 233, 0.18)',
                boxSizing: 'border-box',
              }}
            >
              <Typography.Text strong>{t('formatConvert.form.customModeHint')}</Typography.Text>
              <div style={{ marginTop: 6 }}>{t('formatConvert.form.customModeHintDescription')}</div>
            </div>
            <div style={{ width: '100%' }}>
              <Typography.Text strong>{t('formatConvert.form.customArgs')}</Typography.Text>
              <Input
                value={draft.option.customArgsText}
                style={{ marginTop: 8 }}
                disabled={disableActions}
                placeholder={t('formatConvert.form.customArgsPlaceholder')}
                onChange={value =>
                  setDraft(current => ({
                    ...current,
                    option: {
                      ...current.option,
                      customArgsText: value,
                    },
                  }))
                }
              />
            </div>
          </>
        )}

        <div style={{ width: '100%' }}>
          <Typography.Text strong>{t('formatConvert.form.targetFileName')}</Typography.Text>
          <Input
            value={draft.targetFileName}
            style={{ marginTop: 8 }}
            disabled={disableActions}
            placeholder={t('formatConvert.form.targetFileNamePlaceholder')}
            onChange={value =>
              setDraft(current =>
                current.commandMode === FormatConvertCommandMode.CUSTOM
                  ? syncDraftOutputFormatFromFilename(current, value)
                  : { ...current, targetFileName: value }
              )
            }
          />
        </div>

        <div style={{ width: '100%' }}>
          <Typography.Text strong>{t('formatConvert.form.finalCommand')}</Typography.Text>
          <Input readonly value={commandPreview} style={{ marginTop: 8 }} />
        </div>

        <Button
          theme="solid"
          disabled={disableActions}
          loading={sourceMode === 'cloud' ? cloudSubmitting : false}
          onClick={() => void handleSubmit()}
        >
          {sourceMode === 'local' ? t('formatConvert.local.submit') : t('formatConvert.cloud.submit')}
        </Button>
      </Space>

      <OpenlistBrowser
        open={browserMode === 'source'}
        selectMode="file"
        title={t('formatConvert.cloud.pickSource')}
        onCancel={() => setBrowserMode('')}
        onSelect={item => {
          setCloudSource(item);
          setBrowserMode('');
          setDraft(current => ({
            ...current,
            targetFileName:
              current.targetFileName || getSuggestedTargetFileName(item.name, current.option.outputFormat),
          }));
        }}
      />
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
      <UploadProgressModal visible={localUploading} percent={localUploadProgress} fileName={localFile?.name || ''} />
    </Card>
  );
}
