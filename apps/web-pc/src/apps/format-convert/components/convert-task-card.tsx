import { Card, Space } from '@douyinfe/semi-ui';
import { IconCloudStroked } from '@douyinfe/semi-icons';
import { FormatConvertEngine } from '@volix/types';
import { useState } from 'react';
import { useI18n } from '@/i18n';
import { getConvertType } from '../convert-types';
import { ComicMetadataPanel } from './comic-metadata-panel';
import { ConvertTypeSwitch } from './convert-type-switch';
import { ImageConvertPanel } from './image-convert-panel';
import { MediaConvertPanel } from './media-convert-panel';
import styles from './workbench.module.scss';

interface ConvertTaskCardProps {
  onCreated: () => void;
}

export function ConvertTaskCard(props: ConvertTaskCardProps) {
  const { onCreated } = props;
  const { t } = useI18n();
  const [typeId, setTypeId] = useState('');
  const config = getConvertType(typeId);

  return (
    <Card className={styles.sectionCard} shadows="hover">
      <Space vertical align="start" style={{ width: '100%' }} spacing={20}>
        <div style={{ width: '100%' }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              lineHeight: '32px',
              color: 'var(--semi-color-text-0)',
            }}
          >
            {t('route.formatConvert.title')}
          </div>
        </div>

        <div className={styles.modePickerRow}>
          <div className={styles.modePickerMeta}>
            <div className={styles.sectionLabel}>
              <IconCloudStroked />
              {t('formatConvert.form.sourceMode')}
            </div>
          </div>
          <div className={styles.modePickerControl}>
            <ConvertTypeSwitch value={typeId} onChange={setTypeId} />
          </div>
        </div>

        {config?.engine === FormatConvertEngine.COMIC ? (
          <ComicMetadataPanel onCreated={onCreated} />
        ) : config?.engine === FormatConvertEngine.IMAGE ? (
          <ImageConvertPanel onCreated={onCreated} />
        ) : config ? (
          <MediaConvertPanel sourceKind={config.sourceKind} uploadAccept={config.uploadAccept} onCreated={onCreated} />
        ) : null}
      </Space>
    </Card>
  );
}
