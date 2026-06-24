import { useEffect, useState } from 'react';
import { Input, Modal, Space, Switch, Typography } from '@douyinfe/semi-ui';
import { useI18n } from '@/i18n';
import { createScheduledTask, updateScheduledTask } from '@/services/task-center';
import { getHttpErrorMessage } from '@/utils/error';
import { ScheduledTaskType } from '@volix/types';
import type { ScheduledTask, ScheduledTaskDefaults, ScheduledTaskParams } from '@volix/types';
import { Toast } from '@douyinfe/semi-ui';
import { TaskParamFields } from './task-param-fields';
import { createTaskTypeDraftParams, TASK_TYPE_OPTIONS } from './task-type-meta';

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
  defaults: ScheduledTaskDefaults;
  hasAstrbotConfig: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function TaskEditModal({ visible, task, defaults, hasAstrbotConfig, onClose, onSaved }: TaskEditModalProps) {
  const { t } = useI18n();
  const isEdit = Boolean(task);
  const [name, setName] = useState('');
  const [type, setType] = useState<ScheduledTaskType>(ScheduledTaskType.ASTRBOT_RANDOM_PIC);
  const [cron, setCron] = useState('0 9 * * *');
  const [enabled, setEnabled] = useState(true);
  const [params, setParams] = useState<ScheduledTaskParams>({});
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
      setParams(task.params || {});
    } else {
      setName('');
      setType(ScheduledTaskType.ASTRBOT_RANDOM_PIC);
      setCron('0 9 * * *');
      setEnabled(true);
      setParams(createTaskTypeDraftParams(ScheduledTaskType.ASTRBOT_RANDOM_PIC, defaults));
    }
  }, [visible, task, defaults]);

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
          params,
        });
      } else {
        await createScheduledTask({ name: name.trim(), type, enabled, cron: cron.trim(), params });
      }
      Toast.success(t('taskCenter.save.success'));
      onSaved();
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('taskCenter.save.failed')));
    } finally {
      setSaving(false);
    }
  };

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
            onChange={event => {
              const nextType = event.target.value as ScheduledTaskType;
              setType(nextType);
              setParams(createTaskTypeDraftParams(nextType, defaults));
            }}
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

        <TaskParamFields type={type} params={params} hasAstrbotConfig={hasAstrbotConfig} onChange={setParams} />

        <Space spacing={12} align="center">
          <Switch checked={enabled} onChange={value => setEnabled(value)} />
          <Typography.Text>{t('taskCenter.field.enabled')}</Typography.Text>
        </Space>
      </Space>
    </Modal>
  );
}
