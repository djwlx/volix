import { Button, Empty, Progress, Spin, Typography } from '@douyinfe/semi-ui';
import { IconAlertCircle, IconDeleteStroked, IconTickCircle } from '@douyinfe/semi-icons';
import { useI18n } from '@/i18n';
import styles from './workbench.module.scss';

export type SelectedFileUploadStatus = 'pending' | 'uploading' | 'success' | 'error';

export interface SelectedFileBasketItem {
  key: string;
  primary: string;
  secondary?: string;
  uploadStatus?: SelectedFileUploadStatus;
  uploadPercent?: number;
}

interface SelectedFileBasketProps {
  clearDisabled?: boolean;
  uploading?: boolean;
  items: SelectedFileBasketItem[];
  onClear: () => void;
  onRemove: (key: string) => void;
}

function UploadStatusIndicator(props: { status: SelectedFileUploadStatus; percent: number }) {
  const { status, percent } = props;
  if (status === 'success') {
    return <IconTickCircle size="large" style={{ color: 'var(--semi-color-success)' }} />;
  }
  if (status === 'error') {
    return <IconAlertCircle size="large" style={{ color: 'var(--semi-color-danger)' }} />;
  }
  if (status === 'uploading') {
    return <Progress type="circle" percent={percent} width={36} />;
  }
  return <Spin size="middle" />;
}

export function SelectedFileBasket(props: SelectedFileBasketProps) {
  const { clearDisabled, uploading, items, onClear, onRemove } = props;
  const { t } = useI18n();

  return (
    <div className={styles.basketCard}>
      <div className={styles.basketHeader}>
        <div>
          <Typography.Title heading={6} style={{ margin: 0 }}>
            {t('formatConvert.basket.title')}
          </Typography.Title>
          <div className={styles.basketSummary}>{t('formatConvert.basket.summary', { count: items.length })}</div>
        </div>
        {uploading ? null : (
          <Button theme="borderless" disabled={clearDisabled || !items.length} type="danger" onClick={onClear}>
            {t('formatConvert.basket.clear')}
          </Button>
        )}
      </div>

      {items.length ? (
        <div className={styles.basketList}>
          {items.map(item => (
            <div key={item.key} className={styles.basketItem}>
              <div>
                <div className={styles.basketItemPrimary}>{item.primary}</div>
                {item.secondary ? <div className={styles.basketItemSecondary}>{item.secondary}</div> : null}
              </div>
              {item.uploadStatus ? (
                <div className={styles.basketItemStatus}>
                  <UploadStatusIndicator status={item.uploadStatus} percent={item.uploadPercent || 0} />
                </div>
              ) : (
                <Button
                  icon={<IconDeleteStroked />}
                  theme="borderless"
                  type="danger"
                  onClick={() => onRemove(item.key)}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <Empty
            image={null}
            title={t('formatConvert.basket.emptyTitle')}
            description={t('formatConvert.basket.emptyDescription')}
          />
        </div>
      )}
    </div>
  );
}
