import { Input, Select, Space, Typography } from '@douyinfe/semi-ui';
import { FormatConvertCommandMode, FormatConvertMode } from '@volix/types';
import { useI18n } from '@/i18n';
import {
  applyPresetToDraft,
  buildAudioCodecOptions,
  buildFormatOptions,
  buildPresetOptions,
  buildResolutionOptions,
  buildVideoCodecOptions,
  type FormatConvertFormDraft,
} from '../preset-options';

interface ConvertOptionFormProps {
  draft: FormatConvertFormDraft;
  onChange: (draft: FormatConvertFormDraft) => void;
}

const SelectAny = Select as any;

export function ConvertOptionForm(props: ConvertOptionFormProps) {
  const { draft, onChange } = props;
  const { t } = useI18n();
  const isPresetMode = draft.commandMode === FormatConvertCommandMode.PRESET;
  const formatOptions = buildFormatOptions();
  const presetOptions = buildPresetOptions(FormatConvertMode.LOCAL, t);
  const videoCodecOptions = buildVideoCodecOptions(draft.option.outputFormat);
  const audioCodecOptions = buildAudioCodecOptions();
  const resolutionOptions = buildResolutionOptions();

  return (
    <Space vertical align="start" style={{ width: '100%' }} spacing="medium">
      <div style={{ width: '100%' }}>
        <Typography.Text strong>{t('formatConvert.form.commandMode')}</Typography.Text>
        <SelectAny
          value={draft.commandMode as any}
          style={{ width: '100%', marginTop: 8 }}
          optionList={
            [
              { label: t('formatConvert.form.commandModePreset'), value: FormatConvertCommandMode.PRESET },
              { label: t('formatConvert.form.commandModeCustom'), value: FormatConvertCommandMode.CUSTOM },
            ] as any
          }
          onChange={(value: unknown) =>
            onChange({
              ...draft,
              commandMode: value as FormatConvertCommandMode,
            })
          }
        />
      </div>

      {isPresetMode ? (
        <div style={{ width: '100%' }}>
          <Typography.Text strong>{t('formatConvert.form.preset')}</Typography.Text>
          <SelectAny
            value={draft.presetId as any}
            style={{ width: '100%', marginTop: 8 }}
            optionList={
              presetOptions.map(item => ({
                label: item.label,
                value: item.value,
              })) as any
            }
            onChange={(value: unknown) => onChange(applyPresetToDraft(draft, String(value || '')))}
          />
        </div>
      ) : null}

      {isPresetMode ? (
        <div style={{ width: '100%' }}>
          <Typography.Text strong>{t('formatConvert.form.outputFormat')}</Typography.Text>
          <SelectAny
            value={draft.option.outputFormat as any}
            style={{ width: '100%', marginTop: 8 }}
            optionList={formatOptions as any}
            onChange={(value: unknown) =>
              onChange({
                ...draft,
                option: {
                  ...draft.option,
                  outputFormat: String(value || 'mp4') as never,
                },
              })
            }
          />
        </div>
      ) : null}

      {isPresetMode && videoCodecOptions.length > 0 ? (
        <div style={{ width: '100%' }}>
          <Typography.Text strong>{t('formatConvert.form.videoCodec')}</Typography.Text>
          <SelectAny
            value={draft.option.videoCodec as any}
            style={{ width: '100%', marginTop: 8 }}
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
      ) : null}

      {isPresetMode ? (
        <div style={{ width: '100%' }}>
          <Typography.Text strong>{t('formatConvert.form.audioCodec')}</Typography.Text>
          <SelectAny
            value={draft.option.audioCodec as any}
            style={{ width: '100%', marginTop: 8 }}
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
      ) : null}

      {isPresetMode ? (
        <div style={{ width: '100%' }}>
          <Typography.Text strong>{t('formatConvert.form.resolution')}</Typography.Text>
          <SelectAny
            value={draft.option.resolution as any}
            style={{ width: '100%', marginTop: 8 }}
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
      ) : null}

      <div style={{ width: '100%' }}>
        <Typography.Text strong>{t('formatConvert.form.targetFileName')}</Typography.Text>
        <Input
          value={draft.targetFileName}
          style={{ marginTop: 8 }}
          placeholder={t('formatConvert.form.targetFileNamePlaceholder')}
          onChange={value => onChange({ ...draft, targetFileName: value })}
        />
      </div>

      {!isPresetMode ? (
        <div style={{ width: '100%' }}>
          <Typography.Text strong>{t('formatConvert.form.customArgs')}</Typography.Text>
          <Input
            value={draft.option.customArgsText}
            style={{ marginTop: 8 }}
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
      ) : null}
    </Space>
  );
}
