import { useEffect, useState } from 'react';
import { Banner, Input, Modal, Space, Switch, TagInput, Typography } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router';
import { useI18n } from '@/i18n';
import { createScheduledTask, updateScheduledTask } from '@/services/task-center';
import { getHttpErrorMessage } from '@/utils/error';
import { ScheduledTaskType } from '@volix/types';
import type { AstrbotRandomPicTaskParams, ScheduledTask } from '@volix/types';
import { Toast } from '@douyinfe/semi-ui';
import { TASK_TYPE_OPTIONS } from './task-type-meta';

const selectStyle: React.CSSProperties = {
  marginTop: 4,
  width: '100%',
  minHeight: 36,
  padding: '0 12px',
  borderRadius: 6,
  border: '1px solid var(--semi-color-border)',
  background: 'var(--semi-color-bg-0)',
  color: 'var(--semi-color-text-0)',
  outline: 'none',
  boxSizing: 'border-box',
};

interface TaskEditModalProps {
  visible: boolean;
  task: ScheduledTask | null;
  defaultUmos: string[];
  hasAstrbotConfig: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function TaskEditModal({ visible, task, defaultUmos, hasAstrbotConfig, onClose, onSaved }: TaskEditModalProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const isEdit = Boolean(task);
  const [name, setName] = useState('');
  const [type, setType] = useState<ScheduledTaskType>(ScheduledTaskType.ASTRBOT_RANDOM_PIC);
  const [cron, setCron] = useState('0 9 * * *');
  const [enabled, setEnabled] = useState(true);
  const [umos, setUmos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (task) {
      setName(task.name);
      setType(task.type);
      setCron(task.cron || '0 9 * * *');
      setEnabled(task.enabled);
      setUmos((task.params as AstrbotRandomPicTaskParams)?.umos || []);
    } else {
      setName('');
      setType(ScheduledTaskType.ASTRBOT_RANDOM_PIC);
      setCron('0 9 * * *');
      setEnabled(true);
      setUmos(defaultUmos);
    }
  }, [visible, task, defaultUmos]);

  const buildParams = () => {
    if (type === ScheduledTaskType.ASTRBOT_RANDOM_PIC) {
      return { umos };
    }
    return {};
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.warning(t('taskCenter.name.required'));
      return;
    }
    try {
      setSaving(true);
      if (isEdit && task) {
        await updateScheduledTask({
          id: task.id,
          name: name.trim(),
          enabled,
          cron: cron.trim(),
          params: buildParams(),
        });
      } else {
        await createScheduledTask({ name: name.trim(), type, enabled, cron: cron.trim(), params: buildParams() });
      }
      Toast.success(t('taskCenter.save.success'));
      onSaved();
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('taskCenter.save.failed')));
    } finally {
      setSaving(false);
    }
  };

  const isAstrbotType = type === ScheduledTaskType.ASTRBOT_RANDOM_PIC;

  return (
    <Modal
      title={isEdit ? t('taskCenter.modal.editTitle') : t('taskCenter.modal.createTitle')}
      visible={visible}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={saving}
      okText={t('common.action.saveConfig')}
      cancelText={t('common.action.cancel')}
    >
      <Space vertical spacing={16} align="start" style={{ width: '100%' }}>
        {isAstrbotType && !hasAstrbotConfig ? (
          <Banner
            type="warning"
            description={t('taskCenter.config.title')}
            onClose={() => navigate('/setting/config/account')}
            closeIcon={null}
          />
        ) : null}

        <div style={{ width: '100%' }}>
          <Typography.Text type="secondary">{t('taskCenter.field.name')}</Typography.Text>
          <Input
            value={name}
            placeholder={t('taskCenter.field.name.placeholder')}
            style={{ marginTop: 4 }}
            onChange={value => setName(value)}
          />
        </div>

        <div style={{ width: '100%' }}>
          <Typography.Text type="secondary">{t('taskCenter.field.type')}</Typography.Text>
          <select
            value={type}
            disabled={isEdit}
            style={selectStyle}
            onChange={event => setType(event.target.value as ScheduledTaskType)}
          >
            {TASK_TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </div>

        <div style={{ width: '100%' }}>
          <Typography.Text type="secondary">{t('taskCenter.field.cron')}</Typography.Text>
          <Input
            value={cron}
            placeholder={t('taskCenter.field.cron.placeholder')}
            style={{ marginTop: 4 }}
            onChange={value => setCron(value)}
          />
        </div>

        {isAstrbotType ? (
          <div style={{ width: '100%' }}>
            <Typography.Text type="secondary">{t('taskCenter.field.umos')}</Typography.Text>
            <TagInput
              value={umos}
              placeholder={t('taskCenter.field.umos.placeholder')}
              style={{ marginTop: 4, width: '100%' }}
              onChange={value => setUmos(value)}
            />
          </div>
        ) : null}

        <Space spacing={12} align="center">
          <Switch checked={enabled} onChange={value => setEnabled(value)} />
          <Typography.Text>{t('taskCenter.field.enabled')}</Typography.Text>
        </Space>
      </Space>
    </Modal>
  );
}
