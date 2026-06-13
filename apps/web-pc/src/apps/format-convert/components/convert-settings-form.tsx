import { Input, Select } from '@douyinfe/semi-ui';
import { FormatConvertCommandMode, FormatConvertMode } from '@volix/types';
import { useI18n } from '@/i18n';
import {
  applyCommandModeToDraft,
  applyPresetToDraft,
  buildAudioCodecOptions,
  buildFormatOptions,
  buildResolutionOptions,
  buildVideoCodecOptions,
  buildPresetOptions,
  getPresetDescription,
  replaceTargetFileExtension,
  shouldShowPresetConfig,
  type FormatConvertFormDraft,
} from '../preset-options';
import styles from './workbench.module.scss';

interface ConvertSettingsFormProps {
  disableActions?: boolean;
  draft: FormatConvertFormDraft;
  onChange: (draft: FormatConvertFormDraft) => void;
}

const SelectAny = Select as any;

export function ConvertSettingsForm(props: ConvertSettingsFormProps) {
  const { disableActions, draft, onChange } = props;
  const { t } = useI18n();
  const isPresetMode = draft.commandMode === FormatConvertCommandMode.PRESET;
  const showPresetConfig = shouldShowPresetConfig(draft);
  const presetDescription = getPresetDescription(draft.presetId, t);
  const presetOptions = buildPresetOptions(FormatConvertMode.LOCAL, t);
  const formatOptions = buildFormatOptions();
  const videoCodecOptions = buildVideoCodecOptions(draft.option.outputFormat);
  const audioCodecOptions = buildAudioCodecOptions();
  const resolutionOptions = buildResolutionOptions();

  return (
    <>
      <div style={{ width: '100%' }}>
        <div className={styles.sectionLabel}>{t('formatConvert.form.commandMode')}</div>
        <div style={{ marginTop: 10 }}>
          <SelectAny
            value={draft.commandMode}
            style={{ width: '100%' }}
            disabled={disableActions}
            optionList={
              [
                { label: t('formatConvert.form.commandModePreset'), value: FormatConvertCommandMode.PRESET },
                { label: t('formatConvert.form.commandModeCustom'), value: FormatConvertCommandMode.CUSTOM },
              ] as any
            }
            onChange={(value: unknown) => onChange(applyCommandModeToDraft(draft, value as FormatConvertCommandMode))}
          />
        </div>
      </div>

      {isPresetMode ? (
        <div style={{ width: '100%' }}>
          <div className={styles.sectionLabel}>{t('formatConvert.form.preset')}</div>
          <div style={{ marginTop: 10 }}>
            <SelectAny
              value={draft.presetId}
              style={{ width: '100%' }}
              disabled={disableActions}
              optionList={
                presetOptions.map(item => ({
                  label: item.label,
                  value: item.value,
                })) as any
              }
              onChange={(value: unknown) => {
                const nextDraft = applyPresetToDraft(draft, String(value || ''));
                onChange({
                  ...nextDraft,
                  targetFileName: draft.targetFileName
                    ? replaceTargetFileExtension(draft.targetFileName, nextDraft.option.outputFormat)
                    : draft.targetFileName,
                });
              }}
            />
          </div>
        </div>
      ) : null}

      {isPresetMode && presetDescription ? <div className={styles.targetHint}>{presetDescription}</div> : null}

      {showPresetConfig ? (
        <div style={{ width: '100%' }}>
          <div className={styles.sectionLabel}>{t('formatConvert.form.outputFormat')}</div>
          <div style={{ marginTop: 10 }}>
            <SelectAny
              value={draft.option.outputFormat}
              style={{ width: '100%' }}
              disabled={disableActions}
              optionList={formatOptions as any}
              onChange={(value: unknown) => {
                const outputFormat = String(value || 'mp4');
                const nextVideoOptions = buildVideoCodecOptions(outputFormat);
                const videoCodec = nextVideoOptions.some(item => item.value === draft.option.videoCodec)
                  ? draft.option.videoCodec
                  : nextVideoOptions[0]?.value;
                onChange({
                  ...draft,
                  option: {
                    ...draft.option,
                    outputFormat: outputFormat as never,
                    videoCodec,
                    resolution: nextVideoOptions.length ? draft.option.resolution : 'source',
                  },
                  targetFileName: draft.targetFileName
                    ? replaceTargetFileExtension(draft.targetFileName, outputFormat)
                    : draft.targetFileName,
                });
              }}
            />
          </div>
        </div>
      ) : null}

      {showPresetConfig && videoCodecOptions.length ? (
        <div style={{ width: '100%' }}>
          <div className={styles.sectionLabel}>{t('formatConvert.form.videoCodec')}</div>
          <div style={{ marginTop: 10 }}>
            <SelectAny
              value={draft.option.videoCodec}
              style={{ width: '100%' }}
              disabled={disableActions}
              optionList={videoCodecOptions as any}
              onChange={(value: unknown) =>
                onChange({
                  ...draft,
                  option: {
                    ...draft.option,
                    videoCodec: String(value || ''),
                  },
                })
              }
            />
          </div>
        </div>
      ) : null}

      {showPresetConfig ? (
        <div style={{ width: '100%' }}>
          <div className={styles.sectionLabel}>{t('formatConvert.form.audioCodec')}</div>
          <div style={{ marginTop: 10 }}>
            <SelectAny
              value={draft.option.audioCodec}
              style={{ width: '100%' }}
              disabled={disableActions}
              optionList={audioCodecOptions as any}
              onChange={(value: unknown) =>
                onChange({
                  ...draft,
                  option: {
                    ...draft.option,
                    audioCodec: String(value || ''),
                  },
                })
              }
            />
          </div>
        </div>
      ) : null}

      {showPresetConfig && videoCodecOptions.length ? (
        <div style={{ width: '100%' }}>
          <div className={styles.sectionLabel}>{t('formatConvert.form.resolution')}</div>
          <div style={{ marginTop: 10 }}>
            <SelectAny
              value={draft.option.resolution}
              style={{ width: '100%' }}
              disabled={disableActions}
              optionList={resolutionOptions as any}
              onChange={(value: unknown) =>
                onChange({
                  ...draft,
                  option: {
                    ...draft.option,
                    resolution: String(value || 'source') as never,
                  },
                })
              }
            />
          </div>
        </div>
      ) : null}

      {!isPresetMode ? (
        <div style={{ width: '100%' }}>
          <div className={styles.sectionLabel}>{t('formatConvert.form.customArgs')}</div>
          <div style={{ marginTop: 10 }}>
            <Input
              value={draft.option.customArgsText}
              disabled={disableActions}
              placeholder={t('formatConvert.form.customArgsPlaceholder')}
              onChange={value =>
                onChange({
                  ...draft,
                  option: {
                    ...draft.option,
                    customArgsText: value,
                  },
                })
              }
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
