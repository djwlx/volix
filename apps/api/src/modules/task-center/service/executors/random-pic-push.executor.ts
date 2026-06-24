import fs from 'fs';
import mime from 'mime-types';
import type { AstrbotRandomPicTaskParams } from '@volix/types';
import { log } from '../../../../utils/logger';
import request from '../../../../utils/request';
import { runWithRequestContext } from '../../../../utils/request-context';
import { getRandom115PicMeta } from '../../../115/service/picture.service';
import type { RandomPicMeta } from '../../../115/types/115.types';
import { getSystemRandomPicDefaultUserId } from '../../../user/service/system-setting.service';
import { createUserAstrbotSdk } from '../../../user/service/user-config.service';
import { normalizeUmoList } from '../scheduled-task.service';
import type { TaskLogger } from '../task-logger';
import type { ScheduledTaskExecutorContext } from './index';

const PUSH_USER_AGENT = 'volix-astrbot-push/1.0';

const getRandomPicMetaForActingUser = (actingUserId: string): Promise<RandomPicMeta> =>
  runWithRequestContext({ actingUserId: String(actingUserId), userAgent: PUSH_USER_AGENT }, () =>
    getRandom115PicMeta(PUSH_USER_AGENT)
  );

// 优先用户自己的 115 随机图库，取不到回退系统默认随机图用户
const resolveRandomPicMeta = async (userId: string, logger: TaskLogger): Promise<RandomPicMeta> => {
  try {
    return await getRandomPicMetaForActingUser(userId);
  } catch (selfError) {
    const defaultUserId = await getSystemRandomPicDefaultUserId();
    if (defaultUserId && String(defaultUserId) !== String(userId)) {
      const reason = selfError instanceof Error ? selfError.message : String(selfError);
      log.info('[task-center] 用户随机图库不可用，回退系统默认随机图用户', { userId, defaultUserId, reason });
      logger.warn('用户随机图库不可用，回退系统默认随机图用户', { defaultUserId, reason });
      return getRandomPicMetaForActingUser(defaultUserId);
    }
    throw selfError;
  }
};

// AstrBot 按上传 content-type 判定附件类型；115 下载常返回 application/octet-stream，
// 会被判成 file 导致协议端按文件名找不到文件（ENOENT）。这里以文件名推断的图片 MIME 为准。
const resolveImageContentType = (filename: string, fallbackMime?: string): string => {
  const byName = mime.lookup(filename);
  if (byName && byName.startsWith('image/')) {
    return byName;
  }
  if (fallbackMime && fallbackMime.startsWith('image/')) {
    return fallbackMime;
  }
  return byName || fallbackMime || 'image/jpeg';
};

const loadRandomPicBytes = async (
  meta: RandomPicMeta
): Promise<{ buffer: Buffer; filename: string; contentType: string }> => {
  const filename = meta.fileName || 'random.jpg';
  if (meta.localCacheFilePath && fs.existsSync(meta.localCacheFilePath)) {
    const buffer = await fs.promises.readFile(meta.localCacheFilePath);
    return { buffer, filename, contentType: resolveImageContentType(filename, meta.localCacheMimeType) };
  }

  const response = await request.get(meta.url, {
    responseType: 'arraybuffer',
    headers: { 'User-Agent': PUSH_USER_AGENT },
  });
  const buffer = Buffer.from(response.data as ArrayBuffer);
  return { buffer, filename, contentType: resolveImageContentType(filename) };
};

// 取随机图 -> 取字节 -> 上传 AstrBot -> 投递到目标 umo（任务未配置 umo 时回退账号默认 umos）
export const executeAstrbotRandomPicPush = async ({
  userId,
  params,
  logger,
}: ScheduledTaskExecutorContext): Promise<void> => {
  const { sdk, config } = await createUserAstrbotSdk(userId);
  const taskUmos = normalizeUmoList((params as AstrbotRandomPicTaskParams)?.umos);
  const targetUmos = taskUmos.length > 0 ? taskUmos : normalizeUmoList(config.umos);
  if (targetUmos.length === 0) {
    throw new Error('AstrBot 推送目标 umo 为空');
  }
  logger.info('解析推送目标完成', { umos: targetUmos, useAccountDefault: taskUmos.length === 0 });

  const meta = await resolveRandomPicMeta(String(userId), logger);
  logger.info('已选取随机图片', { fileName: meta.fileName });

  const { buffer, filename, contentType } = await loadRandomPicBytes(meta);
  logger.info('已读取图片内容', { filename, contentType, bytes: buffer.length });

  const results = await sdk.sendMessage({
    umo: targetUmos,
    attachments: [{ file: buffer, filename, contentType }],
  });

  logger.info('已投递到 AstrBot', { delivered: results.length, umos: targetUmos });
  log.info('[task-center] 随机图片推送完成', { userId, delivered: results.length, umos: targetUmos });
};
