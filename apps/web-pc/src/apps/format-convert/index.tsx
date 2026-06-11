import { Toast } from '@douyinfe/semi-ui';
import type { FormatConvertTaskItem } from '@volix/types';
import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { getHttpErrorMessage } from '@/utils/error';
import { cleanupFormatConvertTask, getFormatConvertTasks, retryFormatConvertTask } from '@/services/format-convert';
import { ConvertTaskCard, TaskRecordList } from './components';
import styles from './index.module.scss';

function FormatConvertApp() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<FormatConvertTaskItem[]>([]);

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
    const timer = window.setInterval(() => {
      void loadTasks();
    }, 4000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={styles.page}>
      <ConvertTaskCard onCreated={() => void loadTasks()} />
      <TaskRecordList
        loading={loading}
        tasks={tasks}
        onCleanup={async task => {
          try {
            await cleanupFormatConvertTask(task.id);
            Toast.success(t('formatConvert.record.cleanupSuccess'));
            void loadTasks();
          } catch (error) {
            Toast.error(getHttpErrorMessage(error, t('formatConvert.error.cleanupFailed')));
          }
        }}
        onRetry={async task => {
          try {
            await retryFormatConvertTask(task.id);
            Toast.success(t('formatConvert.record.retrySuccess'));
            void loadTasks();
          } catch (error) {
            Toast.error(getHttpErrorMessage(error, t('formatConvert.error.retryFailed')));
          }
        }}
      />
    </div>
  );
}

export default FormatConvertApp;
