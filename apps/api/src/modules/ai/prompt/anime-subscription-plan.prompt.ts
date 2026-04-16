import type { InternalAiMessage } from '../types/ai.types';

export interface AiAnimeSubscriptionPlanLibraryEntry {
  path: string;
  relativePath: string;
  isDir: boolean;
  size: number;
  modified?: string;
}

export interface AiAnimeSubscriptionPlanRssItem {
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

export interface AiAnimeSubscriptionPlanInput {
  subscriptionName: string;
  aliases: string[];
  matchKeywords: string[];
  seriesRootPath: string;
  renamePattern: string;
  librarySummary?: {
    totalEntries: number;
    seasonEpisodeMap: Record<string, number[]>;
    samplePaths: string[];
    topLevelDirs: string[];
  };
  libraryEntries: AiAnimeSubscriptionPlanLibraryEntry[];
  rssItems: AiAnimeSubscriptionPlanRssItem[];
}

const ANIME_SUBSCRIPTION_PLAN_SYSTEM_PROMPT = `你是一个谨慎的自动追番规划助手。

你的任务：
1. 阅读当前 OpenList 目录摘要，以及少量有代表性的目录和文件信息。
2. 阅读当前 RSS 候选条目信息。
3. 判断每一条 RSS 是否属于当前订阅，是否还需要下载。
4. 尽量推断正确的季、集。
5. 给出下载完成后应该放到的最终目标文件路径 targetPath。

重要约束：
- 你只能根据输入的文本信息判断，不能假装看过视频内容。
- 如果 seriesRootPath 非空，targetPath 必须是绝对路径，并且必须位于 seriesRootPath 之下。
- 如果 seriesRootPath 为空且无法可靠确定最终目录，可以把 targetPath 留空字符串。
- targetPath 必须是“最终文件路径”，不是文件夹路径；需要带扩展名。
- 如果现有目录里已经有同一集、同一文件或明显等价版本，shouldDownload 应为 false。
- 如果标题没有明确写季数，但从目录结构、别名、篇章名、上下文可以合理判断季数，可以推断季数。
- 如果信息不足，优先保守：不要随意下载明显不确定的条目。
- 你可以复用现有目录风格来决定 targetPath，例如已有 “S03/E07.mkv” 风格时应保持一致。
- 不要输出 Markdown，不要解释过程，只输出 JSON。

输出结构必须是：
{
  "summary": "string",
  "decisions": [
    {
      "rssGuid": "string",
      "matched": true,
      "shouldDownload": true,
      "season": 3,
      "episode": 7,
      "targetPath": "/绝对/路径/文件名.mkv",
      "reason": "string",
      "confidence": 0.93
    }
  ]
}

要求：
- decisions 至少覆盖所有“看起来可能相关”的 RSS 条目。
- 如果某条不应下载，也要给出 reason。
- confidence 为 0 到 1 的小数。`;

const summarizeLibraryEntries = (entries: AiAnimeSubscriptionPlanLibraryEntry[]) =>
  entries.map(entry => ({
    relativePath: entry.relativePath,
    isDir: entry.isDir,
    size: entry.size,
  }));

const summarizeRssItems = (items: AiAnimeSubscriptionPlanRssItem[]) =>
  items.map(item => ({
    rssGuid: item.rssGuid,
    title: item.title,
    publishedAt: item.publishedAt || '',
    description: item.description ? item.description.slice(0, 220) : '',
    preliminaryMatched: item.preliminaryMatched,
    preliminarySeason: item.preliminarySeason ?? null,
    preliminaryEpisode: item.preliminaryEpisode ?? null,
    preliminaryResolution: item.preliminaryResolution || '',
    preliminarySubtitleLanguage: item.preliminarySubtitleLanguage || '',
    preliminaryReason: item.preliminaryReason || '',
  }));

export const buildAnimeSubscriptionPlanPromptMessages = (input: AiAnimeSubscriptionPlanInput): InternalAiMessage[] => {
  return [
    {
      role: 'system',
      content: ANIME_SUBSCRIPTION_PLAN_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: JSON.stringify(
        {
          subscriptionName: input.subscriptionName,
          aliases: input.aliases,
          matchKeywords: input.matchKeywords,
          seriesRootPath: input.seriesRootPath,
          renamePattern: input.renamePattern,
          librarySummary: input.librarySummary,
          libraryEntries: summarizeLibraryEntries(input.libraryEntries),
          rssItems: summarizeRssItems(input.rssItems),
        },
        null,
        2
      ),
    },
  ];
};
