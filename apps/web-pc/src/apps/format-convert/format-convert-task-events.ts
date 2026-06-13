import type { FormatConvertTaskItem } from '@volix/types';

export const upsertFormatConvertTask = (tasks: FormatConvertTaskItem[], nextTask: FormatConvertTaskItem) => {
  const currentIndex = tasks.findIndex(task => task.id === nextTask.id);
  if (currentIndex === -1) {
    return [nextTask, ...tasks];
  }

  return tasks.map(task => (task.id === nextTask.id ? nextTask : task));
};

export const removeFormatConvertTaskById = (tasks: FormatConvertTaskItem[], taskId: number) => {
  return tasks.filter(task => task.id !== taskId);
};
