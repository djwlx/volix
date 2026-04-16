import {
  AnimeSubscriptionItemStatus,
  AnimeSubscriptionStatus,
  type AnimeSubscriptionItemResponse,
  type AnimeSubscriptionResponse,
  type CreateAnimeSubscriptionPayload,
  type UpdateAnimeSubscriptionPayload,
} from '@volix/types';
import { badRequest, unauthorized } from '../../shared/http-handler';
import { UserRole } from '@volix/types';
import { AppConfigEnum } from '../../config/model/config.model';
import { getConfig } from '../../config/service/config.service';
import {
  createAnimeSubscription,
  queryAnimeSubscriptionById,
  queryAnimeSubscriptionItems,
  queryAnimeSubscriptions,
  triggerAnimeSubscriptionCheckInBackground,
  updateAnimeSubscription,
} from '../service/anime-subscription.service';
import type { AnimeSubscriptionEntity, AnimeSubscriptionItemEntity } from '../types/anime-subscription.types';
import { getRecentAnimeLogs } from '../service/anime-log.service';
import { queryUser } from '../../user/service/user.service';

const DEFAULT_RENAME_PATTERN = '{{series}}/S{{season}}/E{{episode}}';

type AppContext = Parameters<MyMiddleware>[0];

const ensureAdmin = (ctx: AppContext) => {
  if (ctx.state.userInfo?.role !== UserRole.ADMIN) {
    unauthorized('仅管理员可操作自动追番');
  }
};

const parseStringArray = (value: unknown, field: string) => {
  if (value === undefined || value === null) {
    return [] as string[];
  }
  if (!Array.isArray(value)) {
    badRequest(`${field} 必须是数组`);
  }
  const list = value as unknown[];
  return Array.from(new Set(list.map(item => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)));
};

const parseBoolean = (value: unknown, defaultValue: boolean) => {
  if (value === undefined) {
    return defaultValue;
  }
  return Boolean(value);
};

const parseCheckInterval = (value: unknown, defaultValue: number) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    badRequest('checkIntervalMinutes 必须是正整数');
  }
  return parsed;
};

const parseSmtpAccountConfig = (raw?: string) => {
  if (!raw) {
    return null;
  }
  try {
    const data = JSON.parse(raw) as {
      host?: string;
      port?: number;
      fromEmail?: string;
      username?: string;
      password?: string;
    };
    return data?.host && data?.port && data?.fromEmail && data?.username && data?.password ? data : null;
  } catch {
    return null;
  }
};

const normalizePath = (value: unknown, field: string) => {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) {
    badRequest(`${field} 不能为空`);
  }
  return text;
};

const normalizeOptionalPath = (value: unknown) => {
  return typeof value === 'string' ? value.trim() : '';
};

const normalizeRssUrl = (value: unknown) => {
  const rssUrl = typeof value === 'string' ? value.trim() : '';
  if (!rssUrl || !/^https?:\/\//.test(rssUrl)) {
    badRequest('rssUrl 必须是合法的 http/https 地址');
  }
  return rssUrl;
};

const parseJsonArray = (value: string | undefined) => {
  if (!value) {
    return [] as string[];
  }
  try {
    const data = JSON.parse(value);
    return Array.isArray(data) ? data.filter(item => typeof item === 'string') : [];
  } catch {
    return [] as string[];
  }
};

const formatDate = (value?: string | Date | null) => {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

const buildLatestEpisodeLabel = (items: AnimeSubscriptionItemEntity[]) => {
  let latestSeason = 0;
  let latestEpisode = 0;

  for (const item of items) {
    const season = Number(item.season || 0);
    const episode = Number(item.episode || 0);
    if (!season || !episode) {
      continue;
    }
    if (season > latestSeason || (season === latestSeason && episode > latestEpisode)) {
      latestSeason = season;
      latestEpisode = episode;
    }
  }

  if (!latestSeason || !latestEpisode) {
    return null;
  }

  return `S${String(latestSeason).padStart(2, '0')}E${String(latestEpisode).padStart(2, '0')}`;
};

const normalizeReasonText = (value?: string | null) => {
  const text = String(value || '').trim();
  return text || null;
};

const normalizeStageText = (value?: string | null) => {
  const text = String(value || '').trim();
  return text || null;
};

const reasonLabelMap: Record<string, string> = {
  no_chinese_subtitle_candidate: '没有中文字幕候选资源',
  torrent_url_missing: '缺少种子下载地址',
  qbit_task_not_found_after_enqueue: '已调用 qBit 投递，但未在 qBit 中找到对应任务',
  stale_duplicate_without_qbit_hash: '发现旧的未完成脏数据，已重置后重新投递',
  organized: '已整理完成',
  series_root_path_not_found: '最终番剧目录不存在，将按后续整理结果新建',
  library_empty: '最终番剧目录当前为空',
  no_entries_to_normalize: '最终番剧目录下没有可校正项目',
  series_root_path_empty: '未设置最终番剧目录',
};

const translateReason = (value?: string | null) => {
  const text = normalizeReasonText(value);
  if (!text) {
    return null;
  }
  if (reasonLabelMap[text]) {
    return reasonLabelMap[text];
  }
  if (text.startsWith('torrent_state:')) {
    return `qBit 状态：${text.slice('torrent_state:'.length)}`;
  }
  return text;
};

const extractReasonFromLogs = (logs: string[]) => {
  const lastLine = logs
    .slice()
    .reverse()
    .find(line => /\[check_error\]|\[organize_error\]/.test(line));
  if (!lastLine) {
    return null;
  }
  const markerIndex = lastLine.lastIndexOf('] ');
  return markerIndex >= 0 ? lastLine.slice(markerIndex + 2).trim() : lastLine.trim();
};

const buildSubscriptionMeta = async (entity: AnimeSubscriptionEntity) => {
  const items = (await queryAnimeSubscriptionItems(entity.id as string | number)).map(
    item => item.dataValues as AnimeSubscriptionItemEntity
  );
  const latestEpisode = buildLatestEpisodeLabel(items);
  const latestItem = items[0];
  const latestReasonFromItems =
    latestItem &&
    [AnimeSubscriptionItemStatus.FAILED, AnimeSubscriptionItemStatus.SKIPPED].includes(latestItem.decision_status)
      ? latestItem.reason
      : null;
  const logs =
    entity.status === AnimeSubscriptionStatus.ERROR ? await getRecentAnimeLogs(entity.id as string | number, 50) : [];
  const errorReason = translateReason(latestReasonFromItems) || translateReason(extractReasonFromLogs(logs));

  return {
    latestEpisode,
    errorReason,
    currentStage: normalizeStageText(entity.current_stage),
  };
};

const toSubscriptionResponse = async (entity: AnimeSubscriptionEntity): Promise<AnimeSubscriptionResponse> => {
  const meta = await buildSubscriptionMeta(entity);
  return {
    id: entity.id as string | number,
    name: entity.name,
    aliases: parseJsonArray(entity.aliases),
    rssUrl: entity.rss_url,
    seriesRootPath: entity.series_root_path,
    qbitSavePath: entity.qbit_save_path,
    openlistDownloadPath: entity.openlist_download_path,
    enableEmailNotification: Boolean(entity.enable_email_notification),
    latestEpisode: meta.latestEpisode,
    errorReason: meta.errorReason,
    currentStage: meta.currentStage,
    enabled: Boolean(entity.enabled),
    useAi: Boolean(entity.use_ai),
    matchKeywords: parseJsonArray(entity.match_keywords),
    renamePattern: entity.rename_pattern,
    checkIntervalMinutes: entity.check_interval_minutes,
    lastCheckedAt: formatDate(entity.last_checked_at),
    lastSuccessAt: formatDate(entity.last_success_at),
    status: entity.status,
    createdAt: formatDate(entity.created_at) || undefined,
    updatedAt: formatDate(entity.updated_at) || undefined,
  };
};

const toSubscriptionItemResponse = (entity: AnimeSubscriptionItemEntity): AnimeSubscriptionItemResponse => {
  return {
    id: entity.id as string | number,
    subscriptionId: entity.subscription_id,
    rssGuid: entity.rss_guid,
    rssTitle: entity.rss_title,
    detailUrl: entity.detail_url,
    torrentUrl: entity.torrent_url,
    publishedAt: formatDate(entity.published_at),
    season: entity.season,
    episode: entity.episode,
    episodeRaw: entity.episode_raw,
    resolution: entity.resolution,
    subtitleLanguage: entity.subtitle_language,
    releaseGroup: entity.release_group,
    score: entity.score,
    decisionStatus: entity.decision_status || AnimeSubscriptionItemStatus.PENDING,
    qbitHash: entity.qbit_hash,
    targetPath: entity.target_path,
    reason: translateReason(entity.reason) || undefined,
    createdAt: formatDate(entity.created_at) || undefined,
    updatedAt: formatDate(entity.updated_at) || undefined,
  };
};

const getRequiredSubscription = async (id: string | number) => {
  const result = await queryAnimeSubscriptionById(id);
  if (!result) {
    badRequest('追番任务不存在');
  }
  return (result as NonNullable<typeof result>).dataValues as AnimeSubscriptionEntity;
};

const buildSubscriptionPayload = (
  payload: CreateAnimeSubscriptionPayload | UpdateAnimeSubscriptionPayload,
  options: { partial?: boolean } = {}
): Partial<AnimeSubscriptionEntity> => {
  const { partial = false } = options;
  const nextPayload: Partial<AnimeSubscriptionEntity> = {};

  if (!partial || payload.name !== undefined) {
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    if (!name) {
      badRequest('name 不能为空');
    }
    nextPayload.name = name;
  }

  if (!partial || payload.aliases !== undefined) {
    nextPayload.aliases = JSON.stringify(parseStringArray(payload.aliases, 'aliases'));
  }

  if (!partial || payload.rssUrl !== undefined) {
    nextPayload.rss_url = normalizeRssUrl(payload.rssUrl);
  }

  if (!partial || payload.seriesRootPath !== undefined) {
    nextPayload.series_root_path = normalizeOptionalPath(payload.seriesRootPath);
  }

  if (!partial || payload.qbitSavePath !== undefined) {
    nextPayload.qbit_save_path = normalizePath(payload.qbitSavePath, 'qbitSavePath');
  }

  if (!partial || payload.openlistDownloadPath !== undefined) {
    nextPayload.openlist_download_path = normalizePath(payload.openlistDownloadPath, 'openlistDownloadPath');
  }

  if (!partial || payload.enabled !== undefined) {
    nextPayload.enabled = parseBoolean(payload.enabled, true);
  }

  if (!partial || payload.enableEmailNotification !== undefined) {
    nextPayload.enable_email_notification = parseBoolean(payload.enableEmailNotification, false);
  }

  if (!partial || payload.useAi !== undefined) {
    nextPayload.use_ai = parseBoolean(payload.useAi, true);
  }

  if (!partial || payload.matchKeywords !== undefined) {
    nextPayload.match_keywords = JSON.stringify(parseStringArray(payload.matchKeywords, 'matchKeywords'));
  }

  if (!partial || payload.renamePattern !== undefined) {
    const renamePattern = typeof payload.renamePattern === 'string' ? payload.renamePattern.trim() : '';
    nextPayload.rename_pattern = renamePattern || DEFAULT_RENAME_PATTERN;
  }

  if (!partial || payload.checkIntervalMinutes !== undefined) {
    nextPayload.check_interval_minutes = parseCheckInterval(payload.checkIntervalMinutes, 10);
  }

  if (!partial) {
    nextPayload.status =
      nextPayload.enabled === false ? AnimeSubscriptionStatus.PAUSED : AnimeSubscriptionStatus.ACTIVE;
  }

  return nextPayload;
};

export const getAnimeSubscriptionList: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const result = await queryAnimeSubscriptions();
  return Promise.all(result.map(item => toSubscriptionResponse(item.dataValues as AnimeSubscriptionEntity)));
};

export const getAnimeSubscriptionDetail: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const { id } = ctx.params;
  const result = await getRequiredSubscription(id);
  return toSubscriptionResponse(result);
};

export const createAnimeSubscriptionAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const payload = buildSubscriptionPayload(
    ctx.request.body as CreateAnimeSubscriptionPayload
  ) as AnimeSubscriptionEntity;
  if (payload.enable_email_notification) {
    const [smtpConfigData, currentUser] = await Promise.all([
      getConfig(AppConfigEnum.account_smtp),
      ctx.state.userInfo?.id ? queryUser({ id: ctx.state.userInfo.id as string | number }) : Promise.resolve(null),
    ]);
    if (!parseSmtpAccountConfig(smtpConfigData?.[AppConfigEnum.account_smtp])) {
      badRequest('开启邮件通知前，请先配置 SMTP');
    }
    if (!currentUser?.dataValues?.email_verified) {
      badRequest('开启邮件通知前，请先验证当前登录邮箱');
    }
  }
  const result = await createAnimeSubscription(payload);
  return toSubscriptionResponse(result.dataValues as AnimeSubscriptionEntity);
};

export const updateAnimeSubscriptionAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const { id } = ctx.params;
  await getRequiredSubscription(id);
  const payload = buildSubscriptionPayload(ctx.request.body as UpdateAnimeSubscriptionPayload, { partial: true });
  if (payload.enable_email_notification) {
    const [smtpConfigData, currentUser] = await Promise.all([
      getConfig(AppConfigEnum.account_smtp),
      ctx.state.userInfo?.id ? queryUser({ id: ctx.state.userInfo.id as string | number }) : Promise.resolve(null),
    ]);
    if (!parseSmtpAccountConfig(smtpConfigData?.[AppConfigEnum.account_smtp])) {
      badRequest('开启邮件通知前，请先配置 SMTP');
    }
    if (!currentUser?.dataValues?.email_verified) {
      badRequest('开启邮件通知前，请先验证当前登录邮箱');
    }
  }
  if (payload.enabled !== undefined) {
    payload.status = payload.enabled ? AnimeSubscriptionStatus.ACTIVE : AnimeSubscriptionStatus.PAUSED;
  }
  await updateAnimeSubscription(id, payload);
  const latest = await getRequiredSubscription(id);
  return toSubscriptionResponse(latest);
};

export const toggleAnimeSubscriptionAction: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const { id } = ctx.params;
  const currentValue = await getRequiredSubscription(id);
  const enabled = !currentValue.enabled;
  await updateAnimeSubscription(id, {
    enabled,
    status: enabled ? AnimeSubscriptionStatus.ACTIVE : AnimeSubscriptionStatus.PAUSED,
  });
  const latest = await getRequiredSubscription(id);
  return toSubscriptionResponse(latest);
};

export const triggerAnimeSubscriptionCheck: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const { id } = ctx.params;
  const subscription = await getRequiredSubscription(id);
  const currentUserId = ctx.state.userInfo?.id;
  const currentUser = currentUserId ? await queryUser({ id: currentUserId as string | number }) : null;
  let notifyEmail: string | undefined;
  if (subscription.enable_email_notification) {
    const smtpConfigData = await getConfig(AppConfigEnum.account_smtp);
    if (!parseSmtpAccountConfig(smtpConfigData?.[AppConfigEnum.account_smtp])) {
      badRequest('当前任务已开启邮件通知，但系统尚未配置 SMTP');
    }
    const currentUserEmail = currentUser?.dataValues?.email;
    if (!currentUser?.dataValues?.email_verified || !currentUserEmail) {
      badRequest('当前任务已开启邮件通知，请先验证当前登录邮箱');
    }
    notifyEmail = currentUserEmail;
  }
  const result = await triggerAnimeSubscriptionCheckInBackground(id, {
    notifyEmail,
  });
  return {
    success: true,
    message: result.message,
    checkedAt: new Date().toISOString(),
  };
};

export const getAnimeSubscriptionItems: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const { id } = ctx.params;
  await getRequiredSubscription(id);
  const result = await queryAnimeSubscriptionItems(id);
  return result.map(item => toSubscriptionItemResponse(item.dataValues as AnimeSubscriptionItemEntity));
};

export const getAnimeSubscriptionLogs: MyMiddleware = async ctx => {
  ensureAdmin(ctx);
  const { id } = ctx.params;
  await getRequiredSubscription(id);
  return {
    logs: await getRecentAnimeLogs(id),
  };
};
