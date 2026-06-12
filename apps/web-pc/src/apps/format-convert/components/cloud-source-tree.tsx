import { useMemo } from 'react';
import { Typography } from '@douyinfe/semi-ui';
import { useI18n } from '@/i18n';
import { createCloudSelectionMap, type CloudSelectionEntry } from '../batch-selection';
import { OpenlistTableBrowser } from './openlist-table-browser';
import styles from './workbench.module.scss';

interface CloudSourceTreeProps {
  disabled?: boolean;
  selected: Record<string, CloudSelectionEntry>;
  onSelectionChange: (selected: Record<string, CloudSelectionEntry>) => void;
}

export function CloudSourceTree(props: CloudSourceTreeProps) {
  const { disabled, selected, onSelectionChange } = props;
  const { t } = useI18n();
  const selectedCount = useMemo(() => Object.keys(selected).length, [selected]);

  return (
    <div>
      <div className={styles.treeToolbar}>
        <div>
          <Typography.Title heading={6} style={{ margin: 0 }}>
            {t('formatConvert.cloud.sourceTreeTitle')}
          </Typography.Title>
          <div className={styles.treeHint}>{t('formatConvert.cloud.sourceTreeHint')}</div>
        </div>
      </div>

      <OpenlistTableBrowser
        disabled={disabled}
        selectMode="file"
        selectedPaths={Object.keys(selected)}
        onFileSelectionChange={items => onSelectionChange(createCloudSelectionMap(items))}
      />

      <div className={styles.targetHint}>
        {t('formatConvert.cloud.sourceTreeSelectedHint', { count: selectedCount })}
      </div>
    </div>
  );
}
