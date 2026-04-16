import path from 'path';
import {
  buildAnimeSubscriptionPlanPromptMessages,
  type AiAnimeSubscriptionPlanInput,
} from '../../ai/prompt/anime-subscription-plan.prompt';
import { createAiTraceId, logAiEvent } from '../../ai/service/ai-log.service';
import { runInternalAiJson } from '../../ai/service/ai-client.service';

interface AnimeAiDecisionInput {
  rssGuid: string;
  title: string;
  detailUrl?: string;
  torrentUrl?: string;
  publishedAt?: string;
  description?: string;
  preliminaryMatched: boolean;
  preliminarySeason?: number | null;
  preliminaryEpisode?: number | null;
  preliminaryResolution?: string;
  preliminarySubtitleLanguage?: string;
  preliminaryReason?: string;
}

interface AnimeAiPlanDecision {
  rssGuid: string;
  matched?: boolean;
  shouldDownload?: boolean;
  season?: number | null;
  episode?: number | null;
  targetPath?: string;
  reason?: string;
  confidence?: number;
}

interface AnimeAiPlanResult {
  summary?: string;
  decisions?: AnimeAiPlanDecision[];
}

export interface AnimeAiPlannerInput extends AiAnimeSubscriptionPlanInput {}

export interface AnimeAiPlannerDecision {
  rssGuid: string;
  matched: boolean;
  shouldDownload: boolean;
  season?: number | null;
  episode?: number | null;
  targetPath?: string;
  reason: string;
  confidence: number;
}

const clampConfidence = (value: unknown) => {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return 0.5;
  }
  return Math.max(0, Math.min(1, Number(num.toFixed(4))));
};

const normalizeTargetPath = (seriesRootPath: string, value?: string) => {
  const root = String(seriesRootPath || '').trim();
  if (!root) {
    return '';
  }
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  const normalized = path.posix.normalize(raw);
  if (!normalized.startsWith(root)) {
    return '';
  }
  if (normalized === root || normalized.endsWith('/')) {
    return '';
  }
  return normalized;
};

export const planAnimeSubscriptionWithAi = async (input: AnimeAiPlannerInput) => {
  const traceId = createAiTraceId('anime_plan');
  const messages = buildAnimeSubscriptionPlanPromptMessages(input);

  logAiEvent(traceId, 'start', {
    toolName: 'anime_plan',
    subscriptionName: input.subscriptionName,
    libraryEntryCount: input.libraryEntries.length,
    rssItemCount: input.rssItems.length,
    seriesRootPath: input.seriesRootPath,
  });

  const rawResult = await runInternalAiJson<AnimeAiPlanResult>(messages, {
    traceId,
    toolName: 'anime_plan',
    temperature: 0.1,
  });

  const sourceMap = new Map(input.rssItems.map(item => [item.rssGuid, item]));
  const decisions = Array.isArray(rawResult.decisions) ? rawResult.decisions : [];

  const normalizedDecisions = decisions
    .map(item => {
      const rssGuid = String(item?.rssGuid || '').trim();
      const source = sourceMap.get(rssGuid);
      if (!rssGuid || !source) {
        return null;
      }

      const season = Number(item?.season);
      const episode = Number(item?.episode);
      const targetPath = normalizeTargetPath(input.seriesRootPath, item?.targetPath);

      const normalizedDecision: AnimeAiPlannerDecision = {
        rssGuid,
        matched: item?.matched === true || item?.shouldDownload === true || source.preliminaryMatched,
        shouldDownload: item?.shouldDownload === true,
        season: Number.isFinite(season) && season > 0 ? season : source.preliminarySeason ?? null,
        episode: Number.isFinite(episode) && episode > 0 ? episode : source.preliminaryEpisode ?? null,
        targetPath: targetPath || undefined,
        reason: String(item?.reason || source.preliminaryReason || 'AI 未给出明确理由').trim(),
        confidence: clampConfidence(item?.confidence),
      };
      return normalizedDecision;
    })
    .filter((item): item is AnimeAiPlannerDecision => item !== null);

  logAiEvent(traceId, 'finish', {
    toolName: 'anime_plan',
    summary: String(rawResult.summary || '').trim(),
    decisions: normalizedDecisions,
  });

  return {
    summary: String(rawResult.summary || '').trim(),
    decisions: normalizedDecisions,
  };
};
