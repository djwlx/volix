import { Select } from '@douyinfe/semi-ui';
import type { ReactElement } from 'react';
import { useI18n } from '@/i18n';
import { listConvertTypes } from '../convert-types';
import styles from './workbench.module.scss';

interface ConvertTypeSwitchProps {
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
}

type ConvertTypeSelectProps = {
  disabled?: boolean;
  onChange: (value?: string) => void;
  optionList: Array<{ label: string; value: string }>;
  placeholder?: string;
  value?: string;
};

const ConvertTypeSelect = Select as unknown as (props: ConvertTypeSelectProps) => ReactElement;

export function ConvertTypeSwitch(props: ConvertTypeSwitchProps) {
  const { disabled, value, onChange } = props;
  const { t } = useI18n();
  const optionList = listConvertTypes().map(item => ({ value: item.id, label: t(item.labelKey) }));

  return (
    <div className={styles.modeSwitch}>
      <ConvertTypeSelect
        disabled={disabled}
        optionList={optionList}
        placeholder={t('formatConvert.sourcePicker.placeholder')}
        value={value || undefined}
        onChange={nextValue => onChange(nextValue || '')}
      />
    </div>
  );
}
