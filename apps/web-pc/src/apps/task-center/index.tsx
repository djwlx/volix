import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, Popconfirm, Space, Switch, Table, Tag, Toast, Typography } from '@douyinfe/semi-ui';
import { IconPlus } from '@douyinfe/semi-icons';
import { PageCard, PageShell } from '@/components';
import { useI18n } from '@/i18n';
import { getAccountConfigs } from '@/services/user';
import {
  deleteScheduledTask,
  listScheduledTasks,
  triggerScheduledTask,
  updateScheduledTask,
} from '@/services/task-center';
import { getHttpErrorMessage } from '@/utils/error';
import type { ScheduledTask, ScheduledTaskDefaults } from '@volix/types';
import { TaskEditModal } from './task-edit-modal';
import { getTaskParamSummary, getTaskTypeLabelKey } from './task-type-meta';

function TaskCenterApp() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [defaults, setDefaults] = useState<ScheduledTaskDefaults>({ taskTypeDefaults: {} });
  const [hasAstrbotConfig, setHasAstrbotConfig] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [tasksRes, accountRes] = await Promise.all([listScheduledTasks(), getAccountConfigs()]);
      setTasks(tasksRes.data?.tasks || []);
      setDefaults(tasksRes.data?.defaults || { taskTypeDefaults: {} });
      setHasAstrbotConfig(Boolean(accountRes.data?.astrbot));
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('taskCenter.load.failed')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleToggle = async (task: ScheduledTask, checked: boolean) => {
    try {
      await updateScheduledTask({
        id: task.id,
        name: task.name,
        enabled: checked,
        cron: task.cron,
        params: task.params,
      });
      await loadData();
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('taskCenter.save.failed')));
    }
  };

  const handleTrigger = async (task: ScheduledTask) => {
    try {
      await triggerScheduledTask(task.id);
      Toast.success(t('taskCenter.trigger.accepted'));
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('taskCenter.trigger.failed')));
    }
  };

  const handleDelete = async (task: ScheduledTask) => {
    try {
      await deleteScheduledTask(task.id);
      Toast.success(t('taskCenter.delete.success'));
      await loadData();
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('taskCenter.delete.failed')));
    }
  };

  const openCreate = () => {
    setEditingTask(null);
    setModalVisible(true);
  };

  const openEdit = (task: ScheduledTask) => {
    setEditingTask(task);
    setModalVisible(true);
  };

  const viewTaskLog = (task: ScheduledTask) => {
    navigate(`/log-viewer?type=task&keyword=${encodeURIComponent(task.id)}`);
  };

  const renderLastRun = (task: ScheduledTask) => {
    if (!task.lastRunAt) {
      return <Typography.Text type="tertiary">{t('taskCenter.lastRun.never')}</Typography.Text>;
    }
    const failed = task.lastRunStatus === 'failed';
    return (
      <Typography.Text type={failed ? 'danger' : 'tertiary'} size="small">
        {new Date(task.lastRunAt).toLocaleString()}（
        {failed ? t('taskCenter.status.failed') : t('taskCenter.status.success')}）
      </Typography.Text>
    );
  };

  const renderNextRun = (task: ScheduledTask) => {
    if (!task.nextRunAt) {
      return <Typography.Text type="tertiary">{t('taskCenter.nextRun.none')}</Typography.Text>;
    }
    return (
      <Typography.Text type="tertiary" size="small">
        {new Date(task.nextRunAt).toLocaleString()}
      </Typography.Text>
    );
  };

  const columns = [
    {
      title: t('taskCenter.column.name'),
      dataIndex: 'name',
      render: (_: unknown, task: ScheduledTask) => {
        const summary = getTaskParamSummary(task);
        return (
          <Space vertical align="start" spacing={2}>
            <Typography.Text strong>{task.name}</Typography.Text>
            {summary.length > 0 ? (
              <Typography.Text type="tertiary" size="small">
                {summary.join('、')}
              </Typography.Text>
            ) : null}
          </Space>
        );
      },
    },
    {
      title: t('taskCenter.column.type'),
      dataIndex: 'type',
      render: (_: unknown, task: ScheduledTask) => <Tag color="violet">{t(getTaskTypeLabelKey(task.type))}</Tag>,
    },
    {
      title: t('taskCenter.column.cron'),
      dataIndex: 'cron',
      render: (cron: string) => <Typography.Text code>{cron}</Typography.Text>,
    },
    {
      title: t('taskCenter.column.enabled'),
      dataIndex: 'enabled',
      render: (_: unknown, task: ScheduledTask) => (
        <Switch checked={task.enabled} onChange={checked => void handleToggle(task, checked)} />
      ),
    },
    {
      title: t('taskCenter.column.lastRun'),
      dataIndex: 'lastRunAt',
      render: (_: unknown, task: ScheduledTask) => renderLastRun(task),
    },
    {
      title: t('taskCenter.column.nextRun'),
      dataIndex: 'nextRunAt',
      render: (_: unknown, task: ScheduledTask) => renderNextRun(task),
    },
    {
      title: t('taskCenter.column.actions'),
      dataIndex: 'actions',
      render: (_: unknown, task: ScheduledTask) => (
        <Space>
          <Button size="small" theme="borderless" onClick={() => void handleTrigger(task)}>
            {t('taskCenter.action.runNow')}
          </Button>
          <Button size="small" theme="borderless" onClick={() => viewTaskLog(task)}>
            {t('taskCenter.action.viewLog')}
          </Button>
          <Button size="small" theme="borderless" onClick={() => openEdit(task)}>
            {t('common.action.edit')}
          </Button>
          <Popconfirm title={t('taskCenter.delete.confirm')} onConfirm={() => void handleDelete(task)}>
            <Button size="small" theme="borderless" type="danger">
              {t('common.action.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageShell>
      <PageCard
        title={t('route.taskCenter.title')}
        shadows="hover"
        style={{ width: '100%' }}
        headerExtraContent={
          <Button icon={<IconPlus />} type="primary" onClick={openCreate}>
            {t('taskCenter.action.create')}
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={tasks}
          loading={loading}
          rowKey="id"
          pagination={false}
          empty={t('taskCenter.empty')}
        />
        <TaskEditModal
          visible={modalVisible}
          task={editingTask}
          defaults={defaults}
          hasAstrbotConfig={hasAstrbotConfig}
          onClose={() => setModalVisible(false)}
          onSaved={() => {
            setModalVisible(false);
            void loadData();
          }}
        />
      </PageCard>
    </PageShell>
  );
}

export default TaskCenterApp;
