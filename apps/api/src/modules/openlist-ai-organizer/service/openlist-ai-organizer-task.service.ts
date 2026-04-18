import fs from 'fs';
import path from 'path';
import {
  type AnalyzeOpenlistAiOrganizerPayload,
  type CreateOpenlistAiOrganizerReviseTaskResponse,
  type CreateOpenlistAiOrganizerRetryTaskResponse,
  type DeleteOpenlistAiOrganizerDuplicateFolderResponse,
  type ExecuteOpenlistAiOrganizerPayload,
  type OpenlistAiOrganizerTaskDetail,
  type OpenlistAiOrganizerTaskListResponse,
  type OpenlistAiOrganizerTaskStatus,
  type OpenlistAiOrganizerTaskSummary,
  type OpenlistAiOrganizerTaskType,
  type ReviseOpenlistAiOrganizerAnalyzeTaskPayload,
} from '@volix/types';
import { badRequest } from '../../shared/http-handler';
import { PATH } from '../../../utils/path';
import { taskLog } from '../../../utils/logger';
import {
  analyzeOpenlistFolderWithAi,
  deleteOpenlistAiOrganizerDuplicateFolder,
  executeOpenlistAiOrganizerPlan,
} from './openlist-ai-organizer.service';
import { cleanupOpenlistAiOrganizerTaskCache } from './openlist-ai-organizer-cache.service';

interface OpenlistAiOrganizerTaskStore {
  items: OpenlistAiOrganizerTaskDetail[];
}

const TASK_DIR = path.join(PATH.data, 'openlist-ai-organizer');
const TASK_FILE = path.join(TASK_DIR, 'tasks.json');
const MAX_TASKS = 50;

let storeLock = Promise.resolve();
let processorStarted = false;
let processorLoop: Promise<void> | null = null;

const nowIso = () => new Date().toISOString();

const createTaskId = (type: OpenlistAiOrganizerTaskType) =>
  `oaot_${type}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const ensureTaskStoreFile = async () => {
  await fs.promises.mkdir(TASK_DIR, { recursive: true });
  try {
    await fs.promises.access(TASK_FILE);
  } catch {
    await fs.promises.writeFile(TASK_FILE, JSON.stringify({ items: [] }, null, 2), 'utf8');
  }
};

const withTaskStoreLock = async <T>(runner: () => Promise<T>) => {
  const next = storeLock.then(runner, runner);
  storeLock = next.then(
    () => undefined,
    () => undefined
  );
  return next;
};

const readTaskStore = async (): Promise<OpenlistAiOrganizerTaskStore> => {
  await ensureTaskStoreFile();
  const raw = await fs.promises.readFile(TASK_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw) as Partial<OpenlistAiOrganizerTaskStore>;
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch {
    return {
      items: [],
    };
  }
};

const writeTaskStore = async (store: OpenlistAiOrganizerTaskStore) => {
  await ensureTaskStoreFile();
  await fs.promises.writeFile(
    TASK_FILE,
    JSON.stringify(
      {
        items: store.items.slice(0, MAX_TASKS),
      },
      null,
      2
    ),
    'utf8'
  );
};

const toTaskSummary = (task: OpenlistAiOrganizerTaskDetail): OpenlistAiOrganizerTaskSummary => ({
  id: task.id,
  type: task.type,
  status: task.status,
  rootPath: task.rootPath,
  duplicateFolderName: task.duplicateFolderName,
  basedOnTaskId: task.basedOnTaskId,
  summary: task.summary,
  currentStage: task.currentStage,
  errorMessage: task.errorMessage,
  createdAt: task.createdAt,
  startedAt: task.startedAt,
  finishedAt: task.finishedAt,
  updatedAt: task.updatedAt,
});

const patchTask = async (
  taskId: string,
  updater: (task: OpenlistAiOrganizerTaskDetail) => OpenlistAiOrganizerTaskDetail
) => {
  return withTaskStoreLock(async () => {
    const store = await readTaskStore();
    const index = store.items.findIndex(item => item.id === taskId);
    if (index < 0) {
      return null;
    }
    store.items[index] = updater(store.items[index]);
    await writeTaskStore(store);
    return store.items[index];
  });
};

const takeNextRunnableTask = async () => {
  return withTaskStoreLock(async () => {
    const store = await readTaskStore();
    const index = store.items.findIndex(item => item.status === 'queued');
    if (index < 0) {
      return null;
    }
    const task = store.items[index];
    const nextTask: OpenlistAiOrganizerTaskDetail = {
      ...task,
      status: 'running',
      currentStage: task.type === 'analyze' ? '开始分析目录' : '开始执行整理',
      startedAt: task.startedAt || nowIso(),
      updatedAt: nowIso(),
      errorMessage: undefined,
    };
    store.items[index] = nextTask;
    await writeTaskStore(store);
    return nextTask;
  });
};

const runTask = async (task: OpenlistAiOrganizerTaskDetail) => {
  taskLog.info(`[OPENLIST_AI_ORG][task:${task.id}][start] ${task.type} ${task.rootPath}`);
  try {
    if (task.type === 'analyze') {
      const payload = {
        ...(task.analyzePayload as AnalyzeOpenlistAiOrganizerPayload),
        taskId: task.id,
      };
      await patchTask(task.id, current => ({
        ...current,
        currentStage: '正在递归扫描并进行 AI 分析',
        updatedAt: nowIso(),
      }));
      const analysisResult = await analyzeOpenlistFolderWithAi(payload);
      await patchTask(task.id, current => ({
        ...current,
        status: 'succeeded',
        currentStage: '分析完成',
        summary: analysisResult.summary,
        analysisResult,
        finishedAt: nowIso(),
        updatedAt: nowIso(),
      }));
      taskLog.info(`[OPENLIST_AI_ORG][task:${task.id}][finish] analyze succeeded`);
      return;
    }

    const payload = {
      ...(task.executePayload as ExecuteOpenlistAiOrganizerPayload),
      taskId: task.id,
    };
    await patchTask(task.id, current => ({
      ...current,
      currentStage: '正在执行 OpenList 整理动作',
      updatedAt: nowIso(),
    }));
    const executionResult = await executeOpenlistAiOrganizerPlan(payload);
    await patchTask(task.id, current => ({
      ...current,
      status: 'succeeded',
      currentStage: '执行完成',
      summary: `执行完成：成功 ${executionResult.appliedCount}，跳过 ${executionResult.skippedCount}，失败 ${executionResult.failedCount}`,
      executionResult,
      finishedAt: nowIso(),
      updatedAt: nowIso(),
    }));
    taskLog.info(`[OPENLIST_AI_ORG][task:${task.id}][finish] execute succeeded`);
  } catch (error) {
    const message = (error as Error)?.message || 'task_failed';
    await patchTask(task.id, current => ({
      ...current,
      status: 'failed',
      currentStage: '任务失败',
      errorMessage: message,
      finishedAt: nowIso(),
      updatedAt: nowIso(),
    }));
    taskLog.error(`[OPENLIST_AI_ORG][task:${task.id}][error] ${message}`);
  } finally {
    await cleanupOpenlistAiOrganizerTaskCache(task.id).catch(() => undefined);
  }
};

const processQueueLoop = async () => {
  while (true) {
    const task = await takeNextRunnableTask();
    if (!task) {
      return;
    }
    await runTask(task);
  }
};

export const startOpenlistAiOrganizerTaskProcessor = async () => {
  await withTaskStoreLock(async () => {
    const store = await readTaskStore();
    let changed = false;
    store.items = store.items
      .map(item => {
        if (item.status === 'running') {
          changed = true;
          return {
            ...item,
            status: 'queued' as OpenlistAiOrganizerTaskStatus,
            currentStage: '服务重启后等待恢复执行',
            updatedAt: nowIso(),
          };
        }
        return item;
      })
      .slice(0, MAX_TASKS);
    if (changed) {
      await writeTaskStore(store);
    }
  });

  if (!processorStarted) {
    processorStarted = true;
  }
  if (!processorLoop) {
    processorLoop = processQueueLoop().finally(() => {
      processorLoop = null;
    });
  }
};

const enqueueProcessor = async () => {
  if (!processorStarted) {
    await startOpenlistAiOrganizerTaskProcessor();
    return;
  }
  if (!processorLoop) {
    processorLoop = processQueueLoop().finally(() => {
      processorLoop = null;
    });
  }
};

export const createAnalyzeOpenlistAiOrganizerTask = async (payload: AnalyzeOpenlistAiOrganizerPayload) => {
  const taskId = createTaskId('analyze');
  const now = nowIso();
  const task: OpenlistAiOrganizerTaskDetail = {
    id: taskId,
    type: 'analyze',
    status: 'queued',
    rootPath: payload.rootPath,
    duplicateFolderName: payload.duplicateFolderName || '__AI_DUPLICATES_PENDING__',
    basedOnTaskId: payload.basedOnTaskId,
    analyzePayload: payload,
    createdAt: now,
    updatedAt: now,
    currentStage: payload.basedOnTaskId ? '已进入修订分析队列' : '已进入分析队列',
  };

  await withTaskStoreLock(async () => {
    const store = await readTaskStore();
    store.items.unshift(task);
    await writeTaskStore(store);
  });
  await enqueueProcessor();
  return {
    taskId,
  };
};

export const createReviseOpenlistAiOrganizerAnalyzeTask = async (
  sourceTaskId: string,
  payload: ReviseOpenlistAiOrganizerAnalyzeTaskPayload
): Promise<CreateOpenlistAiOrganizerReviseTaskResponse> => {
  const feedback = String(payload.feedback || '').trim();
  if (!feedback) {
    badRequest('请先输入你希望 AI 调整的内容');
  }

  const sourceTask = await queryOpenlistAiOrganizerTaskDetail(sourceTaskId);
  if (!sourceTask) {
    badRequest('原始分析任务不存在');
  }
  const baseTask = sourceTask as OpenlistAiOrganizerTaskDetail;
  if (baseTask.type !== 'analyze') {
    badRequest('只能基于分析任务发起修订');
  }
  if (!baseTask.analysisResult || baseTask.status !== 'succeeded') {
    badRequest('原始分析任务尚未完成，暂时不能发起修订');
  }

  return createAnalyzeOpenlistAiOrganizerTask({
    rootPath: baseTask.rootPath,
    duplicateFolderName: baseTask.duplicateFolderName,
    model: baseTask.analyzePayload?.model,
    basedOnTaskId: baseTask.id,
    userInstruction: feedback,
  });
};

export const createExecuteOpenlistAiOrganizerTask = async (payload: ExecuteOpenlistAiOrganizerPayload) => {
  const taskId = createTaskId('execute');
  const now = nowIso();
  const task: OpenlistAiOrganizerTaskDetail = {
    id: taskId,
    type: 'execute',
    status: 'queued',
    rootPath: payload.rootPath,
    duplicateFolderName: payload.duplicateFolderName || '__AI_DUPLICATES_PENDING__',
    executePayload: payload,
    createdAt: now,
    updatedAt: now,
    currentStage: '已进入执行队列',
    summary: `待执行 ${payload.items.length} 个整理动作`,
  };

  await withTaskStoreLock(async () => {
    const store = await readTaskStore();
    store.items.unshift(task);
    await writeTaskStore(store);
  });
  await enqueueProcessor();
  return {
    taskId,
  };
};

export const createRetryOpenlistAiOrganizerTask = async (
  sourceTaskId: string
): Promise<CreateOpenlistAiOrganizerRetryTaskResponse> => {
  const sourceTask = await queryOpenlistAiOrganizerTaskDetail(sourceTaskId);
  if (!sourceTask) {
    badRequest('原始任务不存在');
  }

  const baseTask = sourceTask as OpenlistAiOrganizerTaskDetail;
  if (baseTask.type === 'analyze') {
    const payload = baseTask.analyzePayload;
    if (!payload) {
      badRequest('原始分析任务缺少请求参数，无法重试');
    }
    return createAnalyzeOpenlistAiOrganizerTask(payload as AnalyzeOpenlistAiOrganizerPayload);
  }

  const payload = baseTask.executePayload;
  if (!payload) {
    badRequest('原始执行任务缺少请求参数，无法重试');
  }
  return createExecuteOpenlistAiOrganizerTask(payload as ExecuteOpenlistAiOrganizerPayload);
};

export const deleteOpenlistAiOrganizerDuplicateFolderByTask = async (
  taskId: string
): Promise<DeleteOpenlistAiOrganizerDuplicateFolderResponse> => {
  const sourceTask = await queryOpenlistAiOrganizerTaskDetail(taskId);
  if (!sourceTask) {
    badRequest('任务不存在');
  }

  const task = sourceTask as OpenlistAiOrganizerTaskDetail;
  if (task.type !== 'execute') {
    badRequest('只有执行任务才支持删除重复复核目录');
  }
  if (task.status !== 'succeeded' || !task.executionResult) {
    badRequest('请在执行完成后再删除重复复核目录');
  }
  const executionResult = task.executionResult!;
  if (executionResult.duplicateFolderDeleted) {
    return {
      taskId: task.id,
      duplicateFolderPath: executionResult.duplicateFolderPath,
      deleted: true,
      message: '重复复核目录已删除',
    };
  }

  const result = await deleteOpenlistAiOrganizerDuplicateFolder(task.rootPath, task.duplicateFolderName);
  await patchTask(task.id, current => ({
    ...current,
    updatedAt: nowIso(),
    executionResult: current.executionResult
      ? {
          ...current.executionResult,
          duplicateFolderDeleted: true,
        }
      : current.executionResult,
  }));

  return {
    taskId: task.id,
    duplicateFolderPath: result.duplicateFolderPath,
    deleted: result.deleted,
    message: result.message,
  };
};

export const queryOpenlistAiOrganizerTaskList = async (): Promise<OpenlistAiOrganizerTaskListResponse> => {
  const store = await withTaskStoreLock(() => readTaskStore());
  return {
    items: store.items.map(toTaskSummary),
  };
};

export const queryOpenlistAiOrganizerTaskDetail = async (taskId: string) => {
  const store = await withTaskStoreLock(() => readTaskStore());
  return store.items.find(item => item.id === taskId) || null;
};
