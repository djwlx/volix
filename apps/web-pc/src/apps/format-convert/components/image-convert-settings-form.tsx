import { InputNumber, Select } from '@douyinfe/semi-ui';
import type { FormatConvertImageFormat } from '@volix/types';
import { useI18n } from '@/i18n';
import { buildImageFormatOptions, updateImageDraftOption, type ImageConvertFormDraft } from '../image-options';
import styles from './workbench.module.scss';

interface ImageConvertSettingsFormProps {
  disableActions?: boolean;
  draft: ImageConvertFormDraft;
  onChange: (draft: ImageConvertFormDraft) => void;
}

const SelectAny = Select as any;
const InputNumberAny = InputNumber as any;

export function ImageConvertSettingsForm(props: ImageConvertSettingsFormProps) {
  const { disableActions, draft, onChange } = props;
  const { t } = useI18n();

  return (
    <>
      <div style={{ width: '100%' }}>
        <div className={styles.sectionLabel}>{t('formatConvert.image.form.outputFormat')}</div>
        <div style={{ marginTop: 10 }}>
          <SelectAny
            value={draft.option.outputFormat}
            style={{ width: '100%' }}
            disabled={disableActions}
            optionList={buildImageFormatOptions() as any}
            onChange={(value: unknown) =>
              onChange(
                updateImageDraftOption(draft, {
                  outputFormat: String(value || 'webp') as FormatConvertImageFormat,
                })
              )
            }
          />
        </div>
      </div>

      <div style={{ width: '100%' }}>
        <div className={styles.sectionLabel}>{t('formatConvert.image.form.quality')}</div>
        <div style={{ marginTop: 10 }}>
          <InputNumberAny
            value={draft.option.quality}
            min={1}
            max={100}
            style={{ width: '100%' }}
            disabled={disableActions}
            onChange={(value: unknown) => onChange(updateImageDraftOption(draft, { quality: Number(value || 82) }))}
          />
        </div>
      </div>

      <div style={{ width: '100%' }}>
        <div className={styles.sectionLabel}>{t('formatConvert.image.form.width')}</div>
        <div style={{ marginTop: 10 }}>
          <InputNumberAny
            value={draft.option.width}
            min={16}
            max={8192}
            placeholder={t('formatConvert.image.form.widthPlaceholder')}
            style={{ width: '100%' }}
            disabled={disableActions}
            onChange={(value: unknown) => {
              const next = Number(value);
              onChange(updateImageDraftOption(draft, { width: Number.isFinite(next) && next > 0 ? next : undefined }));
            }}
          />
        </div>
      </div>
    </>
  );
}
