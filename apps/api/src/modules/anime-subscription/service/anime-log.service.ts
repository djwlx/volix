import fs from 'fs';
import path from 'path';
import { PATH } from '../../../utils/path';
import { taskLog } from '../../../utils/logger';

const ANIME_STAGE_LABEL_MAP: Record<string, string> = {
  series_root_prepare_result: '准备最终番剧目录',
  rss_fetch_start: '开始拉取 RSS',
  rss_parse_result: 'RSS 解析完成',
  library_normalize_result: '目录命名校正完成',
  openlist_scan_result: '最终番剧目录扫描完成',
  ai_plan_result: 'AI 下载决策完成',
  diff_result: '检查结果汇总',
  qbit_duplicate_reset: '重置旧的未完成脏数据',
  qbit_enqueue_start: '开始投递到 qBit',
  qbit_enqueue_success: '已成功投递到 qBit',
  qbit_enqueue_error: '投递 qBit 失败',
  sync_download_start: '开始同步下载状态',
  sync_download_item: 'qBit 下载状态更新',
  sync_download_finish: '下载状态同步完成',
  organize_start: '开始整理已下载文件',
  organize_skip: '跳过文件整理',
  organize_source_resolved: '已定位待整理源文件',
  organize_move_start: '开始复制并重命名文件',
  organize_success: '文件整理完成',
  organize_error: '文件整理失败',
  post_process_copy_start: '开始复制已下载文件到番剧目录',
  post_process_copy_success: '已复制已下载文件到番剧目录',
  post_process_ai_organize_start: '开始执行 AI 文件整理',
  post_process_ai_organize_success: 'AI 文件整理完成',
  post_process_ai_organize_error: 'AI 文件整理失败',
  mail_notify_start: '开始发送邮件通知',
  mail_notify_success: '邮件通知发送成功',
  mail_notify_error: '邮件通知发送失败',
  library_normalize_ai_error: '目录命名校正 AI 调用失败',
  ai_plan_error: 'AI 下载决策失败',
};

const getAnimeStageLabel = (stage: string) => ANIME_STAGE_LABEL_MAP[stage] || stage;

export const logAnimeEvent = (subscriptionId: string | number, stage: string, payload: unknown) => {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
  taskLog.info(`[ANIME][subscription:${subscriptionId}][${stage}] ${getAnimeStageLabel(stage)} ${text}`);
};

export const logAnimeError = (subscriptionId: string | number, stage: string, error: unknown, payload?: unknown) => {
  const message = (error as Error)?.message || String(error);
  const suffix = payload ? ` ${JSON.stringify(payload)}` : '';
  taskLog.error(`[ANIME][subscription:${subscriptionId}][${stage}] ${getAnimeStageLabel(stage)} ${message}${suffix}`);
};

export const getRecentAnimeLogs = async (subscriptionId: string | number, limit = 100) => {
  const logDir = path.join(PATH.log, 'task');
  if (!fs.existsSync(logDir)) {
    return [];
  }
  const files = fs
    .readdirSync(logDir)
    .filter(file => file.endsWith('.log'))
    .sort()
    .reverse()
    .slice(0, 3);

  const pattern = `[ANIME][subscription:${subscriptionId}]`;
  const lines: string[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(logDir, file), 'utf-8');
    const matched = content
      .split('\n')
      .filter(line => line.includes(pattern))
      .reverse();
    lines.push(...matched);
    if (lines.length >= limit) {
      break;
    }
  }

  return lines.slice(0, limit).reverse();
};
