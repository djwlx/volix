import { runInternalAiJson } from '../../ai/service/ai-client.service';
import { createAiTraceId, logAiEvent } from '../../ai/service/ai-log.service';

export interface AnimeMatchContext {
  name: string;
  aliases: string[];
  matchKeywords: string[];
  useAi: boolean;
}

export interface AnimeMatchInput {
  title: string;
  description?: string;
}

export interface AnimeMatchResult {
  matched: boolean;
  normalizedSeriesName: string;
  season?: number | null;
  episode?: number | null;
  subtitleLanguage: string;
  resolution: string;
  confidence: number;
  releaseGroup: string;
  reason: string;
}

interface NameCandidate {
  raw: string;
  normalized: string;
  seasonHint?: number;
}

interface ParsedSeasonEpisode {
  season?: number | null;
  episode?: number | null;
  seasonSource: 'explicit' | 'implicit' | 'none';
}

const RESOLUTION_PRIORITY = ['2160p', '1440p', '1080p', '720p', '480p'];

const normalizeText = (value: string) => {
  return value
    .toLowerCase()
    .replace(/[\[\]【】（）()<>《》]/g, ' ')
    .replace(
      /\b(2160p|1440p|1080p|720p|480p|x265|x264|hevc|aac|web-dl|webrip|baha|at-x|mp4|mkv|简繁|简中|繁中|中字|字幕|chs|cht)\b/gi,
      ' '
    )
    .replace(/[._\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const detectResolution = (title: string) => {
  const lower = title.toLowerCase();
  return RESOLUTION_PRIORITY.find(item => lower.includes(item)) || '';
};

const detectSubtitleLanguage = (title: string, description = '') => {
  const text = `${title} ${description}`.toLowerCase();
  if (/(简中|繁中|简繁|中字|中文字幕|chs|cht|gb|big5|繁體|简体)/i.test(text)) {
    return 'zh';
  }
  if (/english|eng sub|en sub/.test(text)) {
    return 'en';
  }
  return '';
};

const detectReleaseGroup = (title: string) => {
  const match = title.match(/^\[([^\]]+)\]/);
  return match?.[1]?.trim() || '';
};

const parseSeasonHint = (value: string) => {
  const text = String(value || '').trim();
  if (!text) {
    return null;
  }

  const match = text.match(/^s?(\d{1,2})$/i);
  if (!match) {
    return null;
  }

  const season = Number(match[1]);
  return season > 0 ? season : null;
};

const parseNameCandidate = (value: string): NameCandidate | null => {
  const text = String(value || '').trim();
  if (!text) {
    return null;
  }

  const seasonMappingMatch = text.match(/^(.*?)\s*(?:=>|->|@)\s*S?(\d{1,2})$/i);
  const keyword = seasonMappingMatch?.[1]?.trim() || text;
  const seasonHint = seasonMappingMatch ? parseSeasonHint(seasonMappingMatch[2]) : null;
  const normalized = normalizeText(keyword);

  if (!normalized) {
    return null;
  }

  return {
    raw: keyword,
    normalized,
    seasonHint: seasonHint || undefined,
  };
};

const parseSeasonEpisodeByRegex = (title: string): ParsedSeasonEpisode => {
  const seasonEpisode = title.match(/s(\d{1,2})\s*e(\d{1,3})/i);
  if (seasonEpisode) {
    return {
      season: Number(seasonEpisode[1]),
      episode: Number(seasonEpisode[2]),
      seasonSource: 'explicit',
    };
  }

  const cnSeasonEpisode = title.match(/第\s*([0-9一二三四五六七八九十]+)\s*季[\s\S]{0,12}?第\s*(\d{1,3})\s*[话話集]/i);
  if (cnSeasonEpisode) {
    return {
      season: Number(cnSeasonEpisode[1]) || 1,
      episode: Number(cnSeasonEpisode[2]),
      seasonSource: 'explicit',
    };
  }

  const episodeOnly = title.match(/(?:^|[^\d])(\d{1,3})(?:v\d)?(?:[^\d]|$)/);
  if (episodeOnly) {
    return {
      season: 1,
      episode: Number(episodeOnly[1]),
      seasonSource: 'implicit',
    };
  }

  const cnEpisode = title.match(/第\s*(\d{1,3})\s*[话話集]/i);
  if (cnEpisode) {
    return {
      season: 1,
      episode: Number(cnEpisode[1]),
      seasonSource: 'implicit',
    };
  }

  return {
    season: null,
    episode: null,
    seasonSource: 'none',
  };
};

const buildNameCandidates = (context: AnimeMatchContext) => {
  return Array.from(
    new Map(
      [context.name, ...context.aliases, ...context.matchKeywords]
        .map(parseNameCandidate)
        .filter((item): item is NameCandidate => Boolean(item))
        .map(item => [item.normalized, item])
    ).values()
  );
};

const runRuleMatch = (context: AnimeMatchContext, input: AnimeMatchInput): AnimeMatchResult => {
  const candidates = buildNameCandidates(context);
  const normalizedTitle = normalizeText(input.title);
  const matchedCandidate = candidates.find(candidate => {
    return candidate.normalized && normalizedTitle.includes(candidate.normalized);
  });
  const seasonEpisode = parseSeasonEpisodeByRegex(input.title);
  const inferredSeason =
    seasonEpisode.seasonSource === 'explicit'
      ? seasonEpisode.season
      : matchedCandidate?.seasonHint || seasonEpisode.season;
  const resolution = detectResolution(input.title);
  const subtitleLanguage = detectSubtitleLanguage(input.title, input.description);

  return {
    matched: Boolean(matchedCandidate),
    normalizedSeriesName: context.name,
    season: inferredSeason,
    episode: seasonEpisode.episode,
    subtitleLanguage,
    resolution,
    confidence: matchedCandidate ? 0.9 : 0.2,
    releaseGroup: detectReleaseGroup(input.title),
    reason: matchedCandidate
      ? matchedCandidate.seasonHint && seasonEpisode.seasonSource !== 'explicit'
        ? `规则命中：${matchedCandidate.raw}，按别名季数映射为 S${String(matchedCandidate.seasonHint).padStart(2, '0')}`
        : `规则命中：${matchedCandidate.raw}`
      : '规则未命中',
  };
};

const normalizeAiMatchResult = (
  context: AnimeMatchContext,
  input: AnimeMatchInput,
  raw: Partial<AnimeMatchResult> | null | undefined
): AnimeMatchResult => {
  const base = runRuleMatch(context, input);
  const confidence = Number(raw?.confidence);

  return {
    matched: raw?.matched === true,
    normalizedSeriesName: String(raw?.normalizedSeriesName || context.name).trim() || context.name,
    season: Number.isFinite(Number(raw?.season)) ? Number(raw?.season) : base.season,
    episode: Number.isFinite(Number(raw?.episode)) ? Number(raw?.episode) : base.episode,
    subtitleLanguage: String(raw?.subtitleLanguage || base.subtitleLanguage || '').trim(),
    resolution: String(raw?.resolution || base.resolution || '').trim(),
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : base.confidence,
    releaseGroup: base.releaseGroup,
    reason: String(raw?.reason || 'AI 判定').trim(),
  };
};

const runAiMatch = async (context: AnimeMatchContext, input: AnimeMatchInput) => {
  const traceId = createAiTraceId('anime_match');
  const messages = [
    {
      role: 'system' as const,
      content: `你是一个谨慎的番剧资源匹配助手。请根据订阅名称、别名、关键词、RSS 标题和描述，判断条目是否属于目标番剧，并抽取季、集、字幕语言、分辨率。

只输出 JSON，结构如下：
{
  "matched": true,
  "normalizedSeriesName": "string",
  "season": 1,
  "episode": 2,
  "subtitleLanguage": "zh|en|jp|unknown",
  "resolution": "2160p|1440p|1080p|720p|480p|unknown",
  "confidence": 0.93,
  "reason": "string"
}`,
    },
    {
      role: 'user' as const,
      content: JSON.stringify(
        {
          subscriptionName: context.name,
          aliases: context.aliases,
          matchKeywords: context.matchKeywords,
          title: input.title,
          description: input.description || '',
        },
        null,
        2
      ),
    },
  ];

  logAiEvent(traceId, 'start', { toolName: 'anime_match', title: input.title, subscription: context.name });
  const raw = await runInternalAiJson<AnimeMatchResult>(messages, {
    traceId,
    toolName: 'anime_match',
    temperature: 0.1,
  });
  logAiEvent(traceId, 'finish', { toolName: 'anime_match', result: raw });
  return raw;
};

export const matchAnimeRssItem = async (
  context: AnimeMatchContext,
  input: AnimeMatchInput
): Promise<AnimeMatchResult> => {
  const ruleResult = runRuleMatch(context, input);
  if (ruleResult.matched && ruleResult.episode) {
    return ruleResult;
  }
  if (!context.useAi) {
    return ruleResult;
  }

  try {
    const aiResult = await runAiMatch(context, input);
    const normalized = normalizeAiMatchResult(context, input, aiResult);
    if (normalized.matched && normalized.confidence >= ruleResult.confidence) {
      return normalized;
    }
  } catch {
    // AI is a helper only; fallback to the rule result.
  }

  return ruleResult;
};

export const getResolutionScore = (resolution?: string) => {
  const index = RESOLUTION_PRIORITY.indexOf(String(resolution || '').toLowerCase());
  return index >= 0 ? RESOLUTION_PRIORITY.length - index : 0;
};
