import fs from 'fs';
import path from 'path';
import { listAllRssSubscriptionStates } from './rss-feed-db.service';

interface PendingTaskMeta {
  userId: string;
  route: string;
}

const normalizeText = (value: string) => String(value || '').trim();

const readPendingTaskMeta = async (filePath: string): Promise<PendingTaskMeta | null> => {
  try {
    const raw = await fs.promises.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<PendingTaskMeta>;
    const userId = normalizeText(String(parsed.userId || ''));
    const route = normalizeText(String(parsed.route || ''));
    if (!userId || !route) {
      return null;
    }
    return { userId, route };
  } catch {
    return null;
  }
};

const buildActiveSubscriptionRouteMap = async () => {
  const rows = await listAllRssSubscriptionStates();
  const map = new Map<string, Set<string>>();
  rows.forEach(row => {
    const userId = normalizeText(String(row.userId || ''));
    const route = normalizeText(String(row.route || ''));
    if (!userId || !route) {
      return;
    }
    const current = map.get(userId) || new Set<string>();
    current.add(route);
    map.set(userId, current);
  });
  return map;
};

export const prunePendingTasksBySubscriptions = async (params: { dirPath: string; taskFileNames: string[] }) => {
  const routeMapByUser = await buildActiveSubscriptionRouteMap();
  const remained: string[] = [];
  for (const taskFileName of params.taskFileNames) {
    const filePath = path.join(params.dirPath, taskFileName);
    const task = await readPendingTaskMeta(filePath);
    if (!task) {
      await fs.promises.rm(filePath, { force: true }).catch(() => undefined);
      continue;
    }
    const allowedRoutes = routeMapByUser.get(task.userId);
    if (!allowedRoutes || !allowedRoutes.has(task.route)) {
      await fs.promises.rm(filePath, { force: true }).catch(() => undefined);
      continue;
    }
    remained.push(taskFileName);
  }
  return remained;
};
