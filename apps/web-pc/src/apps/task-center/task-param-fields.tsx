import { Banner, TagInput, Typography } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router';
import { useI18n } from '@/i18n';
import { ScheduledTaskType } from '@volix/types';
import type { AstrbotRandomPicTaskParams, ScheduledTaskParams } from '@volix/types';

interface TaskParamFieldsProps {
  type: ScheduledTaskType;
  params: ScheduledTaskParams;
  hasAstrbotConfig: boolean;
  onChange: (params: ScheduledTaskParams) => void;
}

export function TaskParamFields({ type, params, hasAstrbotConfig, onChange }: TaskParamFieldsProps) {
  const { t } = useI18n();
  const navigate = useNavigate();

  if (type === ScheduledTaskType.ASTRBOT_RANDOM_PIC) {
    const current = (params as AstrbotRandomPicTaskParams)?.umos || [];
    return (
      <>
        {!hasAstrbotConfig ? (
          <Banner
            type="warning"
            description={t('taskCenter.config.title')}
            onClose={() => navigate('/setting/config/account')}
            closeIcon={null}
          />
        ) : null}
        <div style={{ width: '100%' }}>
          <Typography.Text type="secondary">{t('taskCenter.field.umos')}</Typography.Text>
          <TagInput
            value={current}
            placeholder={t('taskCenter.field.umos.placeholder')}
            style={{ marginTop: 4, width: '100%' }}
            onChange={value => onChange({ umos: value })}
          />
        </div>
      </>
    );
  }

  return null;
}
