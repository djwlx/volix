import path from 'path';
import { parseRssFeedItemsFromXml } from './rss-feed-item-parser.service';

interface RouteQueueMetaItem {
  route: string;
  routeName: string;
  itemCount: number;
}

const countTaskItems = (xml: string) => {
  try {
    const parsed = parseRssFeedItemsFromXml(String(xml || ''));
    return Math.max(0, parsed.items.length || 0);
  } catch {
    return 0;
  }
};

export const readTaskRouteMeta = async (params: {
  targetDir: string;
  userId: string;
  listTaskFileNames: (targetDir: string) => Promise<string[]>;
  readPendingTask: (
    filePath: string
  ) => Promise<{ userId: string; route: string; routeName: string; xml: string } | null>;
}) => {
  const files = await params.listTaskFileNames(params.targetDir);
  const records = (
    await Promise.all(
      files.map(async name => {
        const task = await params.readPendingTask(path.join(params.targetDir, name));
        if (!task || task.userId !== params.userId) {
          return null;
        }
        return {
          route: task.route,
          routeName: task.routeName || task.route,
          itemCount: countTaskItems(task.xml),
        };
      })
    )
  ).filter(Boolean) as RouteQueueMetaItem[];

  const routeMap = new Map<string, RouteQueueMetaItem>();
  records.forEach(item => {
    const current = routeMap.get(item.route);
    if (!current) {
      routeMap.set(item.route, { ...item });
      return;
    }
    routeMap.set(item.route, {
      ...current,
      itemCount: current.itemCount + item.itemCount,
    });
  });

  return Array.from(routeMap.values());
};
