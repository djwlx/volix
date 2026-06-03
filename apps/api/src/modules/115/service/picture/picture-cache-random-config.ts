import type { SetPicRandomCacheConfigParams } from '@volix/types';
import { AppConfigEnum } from '../../../config/model/config.model';
import { getConfig, setConfig } from '../../../config/service/config.service';
import { badRequest } from '../../../shared/http-handler';
import { t } from '../../../../utils/i18n';
import { PicRandomCacheConfig } from '../../types/115.types';

export const DEFAULT_RANDOM_CACHE_CONFIG: PicRandomCacheConfig = {
  sourceWeights: {
    memory: 0,
    local: 50,
    cloud: 50,
  },
  memoryMaxSizeMb: 100,
  localMaxSizeMb: 2048,
  randomNoRepeatWindowMinutes: 5,
  randomNoRepeatMaxCount: 50,
  cloudProxyUrl: '',
  autoPlayIntervalSeconds: 10,
};

export const MIN_RANDOM_CACHE_SIZE_MB = 100;
export const MAX_RANDOM_CACHE_SIZE_MB = 102400;
export const MIN_RANDOM_NO_REPEAT_WINDOW_MINUTES = 0;
export const MAX_RANDOM_NO_REPEAT_WINDOW_MINUTES = 24 * 60;
export const MIN_RANDOM_NO_REPEAT_MAX_COUNT = 1;
export const MAX_RANDOM_NO_REPEAT_MAX_COUNT = 10000;
export const MIN_AUTO_PLAY_INTERVAL_SECONDS = 1;
export const MAX_AUTO_PLAY_INTERVAL_SECONDS = 3600;

export const normalizeRandomCacheConfig = (input?: Partial<PicRandomCacheConfig> | null): PicRandomCacheConfig => {
  const safeInput = input || {};
  const sourceLocalRaw = Number(safeInput?.sourceWeights?.local ?? DEFAULT_RANDOM_CACHE_CONFIG.sourceWeights.local);
  const sourceCloudRaw = Number(safeInput?.sourceWeights?.cloud ?? DEFAULT_RANDOM_CACHE_CONFIG.sourceWeights.cloud);
  const sourceMemoryRaw = Number(safeInput?.sourceWeights?.memory ?? DEFAULT_RANDOM_CACHE_CONFIG.sourceWeights.memory);
  const memoryRaw =
    typeof safeInput?.memoryMaxSizeMb === 'number' && Number.isFinite(safeInput.memoryMaxSizeMb)
      ? safeInput.memoryMaxSizeMb
      : DEFAULT_RANDOM_CACHE_CONFIG.memoryMaxSizeMb;
  const localRaw =
    typeof safeInput?.localMaxSizeMb === 'number' && Number.isFinite(safeInput.localMaxSizeMb)
      ? safeInput.localMaxSizeMb
      : DEFAULT_RANDOM_CACHE_CONFIG.localMaxSizeMb;
  const randomNoRepeatWindowMinutesRaw =
    typeof safeInput?.randomNoRepeatWindowMinutes === 'number' && Number.isFinite(safeInput.randomNoRepeatWindowMinutes)
      ? safeInput.randomNoRepeatWindowMinutes
      : DEFAULT_RANDOM_CACHE_CONFIG.randomNoRepeatWindowMinutes;
  const randomNoRepeatMaxCountRaw =
    typeof safeInput?.randomNoRepeatMaxCount === 'number' && Number.isFinite(safeInput.randomNoRepeatMaxCount)
      ? safeInput.randomNoRepeatMaxCount
      : DEFAULT_RANDOM_CACHE_CONFIG.randomNoRepeatMaxCount;
  const cloudProxyUrlRaw = typeof safeInput?.cloudProxyUrl === 'string' ? safeInput.cloudProxyUrl.trim() : '';
  const autoPlayIntervalSecondsRaw =
    typeof safeInput?.autoPlayIntervalSeconds === 'number' && Number.isFinite(safeInput.autoPlayIntervalSeconds)
      ? safeInput.autoPlayIntervalSeconds
      : DEFAULT_RANDOM_CACHE_CONFIG.autoPlayIntervalSeconds;

  const safeMemoryWeight = Math.max(0, Math.round(Number.isFinite(sourceMemoryRaw) ? sourceMemoryRaw : 0));
  const safeLocalWeight = Math.max(0, Math.round(Number.isFinite(sourceLocalRaw) ? sourceLocalRaw : 0));
  const safeCloudWeight = Math.max(0, Math.round(Number.isFinite(sourceCloudRaw) ? sourceCloudRaw : 0));
  const localAndCloudTotal = safeLocalWeight + safeCloudWeight;
  const fallbackCloudWeight = safeCloudWeight + safeMemoryWeight;

  const normalizedWeights =
    localAndCloudTotal > 0
      ? {
          memory: 0,
          local: Math.round((safeLocalWeight / localAndCloudTotal) * 100),
          cloud: 0,
        }
      : {
          memory: 0,
          local: 50,
          cloud: 50,
        };

  normalizedWeights.cloud = 100 - normalizedWeights.local;
  if (localAndCloudTotal === 0 && fallbackCloudWeight > 0) {
    normalizedWeights.local = 0;
    normalizedWeights.cloud = 100;
  }

  return {
    sourceWeights: normalizedWeights,
    memoryMaxSizeMb: Math.min(MAX_RANDOM_CACHE_SIZE_MB, Math.max(MIN_RANDOM_CACHE_SIZE_MB, Math.round(memoryRaw))),
    localMaxSizeMb: Math.min(MAX_RANDOM_CACHE_SIZE_MB, Math.max(MIN_RANDOM_CACHE_SIZE_MB, Math.round(localRaw))),
    randomNoRepeatWindowMinutes: Math.min(
      MAX_RANDOM_NO_REPEAT_WINDOW_MINUTES,
      Math.max(MIN_RANDOM_NO_REPEAT_WINDOW_MINUTES, Math.round(randomNoRepeatWindowMinutesRaw))
    ),
    randomNoRepeatMaxCount: Math.min(
      MAX_RANDOM_NO_REPEAT_MAX_COUNT,
      Math.max(MIN_RANDOM_NO_REPEAT_MAX_COUNT, Math.round(randomNoRepeatMaxCountRaw))
    ),
    cloudProxyUrl: cloudProxyUrlRaw,
    autoPlayIntervalSeconds: Math.min(
      MAX_AUTO_PLAY_INTERVAL_SECONDS,
      Math.max(MIN_AUTO_PLAY_INTERVAL_SECONDS, Math.round(autoPlayIntervalSecondsRaw))
    ),
  };
};

const isValidCloudProxyUrl = (value: string) => {
  if (!value) {
    return true;
  }

  try {
    const target = new URL(value);
    return target.protocol === 'http:' || target.protocol === 'https:';
  } catch {
    return false;
  }
};

export const parseRandomCacheConfig = (raw?: string | null) => {
  if (!raw) {
    return DEFAULT_RANDOM_CACHE_CONFIG;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PicRandomCacheConfig>;
    return normalizeRandomCacheConfig(parsed);
  } catch {
    return DEFAULT_RANDOM_CACHE_CONFIG;
  }
};

export const getRandomCacheConfig = async (): Promise<PicRandomCacheConfig> => {
  const config = await getConfig(AppConfigEnum.picture_115_random_weights);
  return parseRandomCacheConfig(config?.picture_115_random_weights || '');
};

export const setRandomCacheConfig = async (params: SetPicRandomCacheConfigParams) => {
  const current = await getRandomCacheConfig();
  const nextWeightsRaw = {
    memory: Number(params?.sourceWeights?.memory ?? 0),
    local: Number(params?.sourceWeights?.local ?? current.sourceWeights.local),
    cloud: Number(params?.sourceWeights?.cloud ?? current.sourceWeights.cloud),
  };

  const next = normalizeRandomCacheConfig({
    sourceWeights: nextWeightsRaw,
    memoryMaxSizeMb: typeof params.memoryMaxSizeMb === 'number' ? params.memoryMaxSizeMb : current.memoryMaxSizeMb,
    localMaxSizeMb: typeof params.localMaxSizeMb === 'number' ? params.localMaxSizeMb : current.localMaxSizeMb,
    randomNoRepeatWindowMinutes:
      typeof params.randomNoRepeatWindowMinutes === 'number'
        ? params.randomNoRepeatWindowMinutes
        : current.randomNoRepeatWindowMinutes,
    randomNoRepeatMaxCount:
      typeof params.randomNoRepeatMaxCount === 'number'
        ? params.randomNoRepeatMaxCount
        : current.randomNoRepeatMaxCount,
    cloudProxyUrl: typeof params.cloudProxyUrl === 'string' ? params.cloudProxyUrl : current.cloudProxyUrl,
    autoPlayIntervalSeconds:
      typeof params.autoPlayIntervalSeconds === 'number'
        ? params.autoPlayIntervalSeconds
        : current.autoPlayIntervalSeconds,
  });

  if (!isValidCloudProxyUrl(next.cloudProxyUrl)) {
    badRequest(t('pic115Api.invalidCloudProxyUrl'));
  }

  await setConfig(AppConfigEnum.picture_115_random_weights, JSON.stringify(next));
  return next;
};
