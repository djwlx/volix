import { Toast } from '@douyinfe/semi-ui';
import type { FormatConvertTaskItem } from '@volix/types';
import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { getHttpErrorMessage } from '@/utils/error';
import {
  deleteFormatConvertTask,
  deleteFormatConvertTasks,
  getFormatConvertTasks,
  retryFormatConvertTask,
} from '@/services/format-convert';
import { websocketEventBus } from '@/services/websocket-event-bus';
import { ConvertTaskCard, TaskRecordList } from './components';
import { subscribeToFormatConvertTaskEvents } from './format-convert-realtime';
import { removeFormatConvertTaskById, upsertFormatConvertTask } from './format-convert-task-events';
import styles from './index.module.scss';

function FormatConvertApp() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<FormatConvertTaskItem[]>([]);

  const syncTasksWhenSocketOffline = () => {
    if (websocketEventBus.getState() !== 'connected') {
      void loadTasks();
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await getFormatConvertTasks();
      setTasks(response.data.items || []);
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('formatConvert.error.loadTasksFailed')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();

    const unsubscribe = subscribeToFormatConvertTaskEvents({
      onCreated: task => {
        setTasks(current => upsertFormatConvertTask(current, task));
      },
      onUpdated: task => {
        setTasks(current => upsertFormatConvertTask(current, task));
      },
      onDeleted: taskId => {
        setTasks(current => removeFormatConvertTaskById(current, taskId));
      },
      onReconnect: () => {
        void loadTasks();
      },
    });

    void websocketEventBus.connect();

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className={styles.page}>
      <ConvertTaskCard onCreated={syncTasksWhenSocketOffline} />
      <TaskRecordList
        loading={loading}
        tasks={tasks}
        onBatchDelete={async taskIds => {
          try {
            const response = await deleteFormatConvertTasks(taskIds);
            Toast.success(
              t('formatConvert.record.batchDeleteSuccess', {
                count: response.data?.deletedCount ?? taskIds.length,
              })
            );
            syncTasksWhenSocketOffline();
          } catch (error) {
            Toast.error(getHttpErrorMessage(error, t('formatConvert.error.deleteFailed')));
          }
        }}
        onDelete={async task => {
          try {
            await deleteFormatConvertTask(task.id);
            Toast.success(t('formatConvert.record.deleteSuccess'));
            syncTasksWhenSocketOffline();
          } catch (error) {
            Toast.error(getHttpErrorMessage(error, t('formatConvert.error.deleteFailed')));
          }
        }}
        onRetry={async task => {
          try {
            await retryFormatConvertTask(task.id);
            Toast.success(t('formatConvert.record.retrySuccess'));
            syncTasksWhenSocketOffline();
          } catch (error) {
            Toast.error(getHttpErrorMessage(error, t('formatConvert.error.retryFailed')));
          }
        }}
      />
    </div>
  );
}

export default FormatConvertApp;
