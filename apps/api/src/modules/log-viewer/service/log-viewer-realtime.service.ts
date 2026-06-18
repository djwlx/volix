import fs from 'fs';
import path from 'path';
import { PATH } from '../../../utils/path';
import { emitWebsocketEventToAllUsersDebounced } from '../../shared/websocket/ws-server';

const LOG_VIEWER_UPDATED_EVENT = 'log-viewer.updated';
const WATCH_INTERVAL_MS = 3000;
const LOG_VIEWER_UPDATED_DEBOUNCE_MS = 600;

let watcherStarted = false;
let watcherTimer: NodeJS.Timeout | null = null;
let lastFingerprint = '';

const toSafeMtime = async (filePath: string) => {
  try {
    const stat = await fs.promises.stat(filePath);
    return Number(stat.mtimeMs || 0);
  } catch {
    return 0;
  }
};

const collectLatestFingerprint = async () => {
  const targets = [path.join(PATH.log, 'normal'), path.join(PATH.log, 'databse')];
  const fingerprints: string[] = [];

  for (const targetDir of targets) {
    const entries = await fs.promises.readdir(targetDir).catch(() => [] as string[]);
    const logFiles = entries.filter(name => name.endsWith('.log') || /\.log\.\d+$/.test(name)).sort();
    const fileFingerprints = await Promise.all(
      logFiles.map(async fileName => {
        const absolutePath = path.join(targetDir, fileName);
        const mtime = await toSafeMtime(absolutePath);
        return `${fileName}:${mtime}`;
      })
    );
    fingerprints.push(`${targetDir}|${fileFingerprints.join(',')}`);
  }

  return fingerprints.join('||');
};

const notifyLogViewerUpdated = () => {
  emitWebsocketEventToAllUsersDebounced(
    LOG_VIEWER_UPDATED_EVENT,
    {
      ts: new Date().toISOString(),
    },
    {
      delayMs: LOG_VIEWER_UPDATED_DEBOUNCE_MS,
    }
  );
};

const tickLogViewerWatcher = async () => {
  const nextFingerprint = await collectLatestFingerprint();
  if (lastFingerprint && nextFingerprint !== lastFingerprint) {
    notifyLogViewerUpdated();
  }
  lastFingerprint = nextFingerprint;
};

export const startLogViewerRealtimeWatcher = () => {
  if (watcherStarted) {
    return;
  }
  watcherStarted = true;
  void tickLogViewerWatcher();
  watcherTimer = setInterval(() => {
    void tickLogViewerWatcher();
  }, WATCH_INTERVAL_MS);
};

export const stopLogViewerRealtimeWatcher = () => {
  if (!watcherTimer) {
    return;
  }
  clearInterval(watcherTimer);
  watcherTimer = null;
  watcherStarted = false;
  lastFingerprint = '';
};
