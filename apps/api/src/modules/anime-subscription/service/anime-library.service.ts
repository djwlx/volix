import path from 'path';
import { createOpenlistSdk } from '../../../sdk';
import { getOpenlistAccountConfig } from './anime-config.service';
import type { OpenlistFsObject, OpenlistSdk } from '../../../sdk/openlist/create-openlist.sdk';

interface ExistingEpisodeMap {
  seasons: Record<number, Record<number, boolean>>;
  files: string[];
}

export interface AnimeLibraryEntry {
  path: string;
  relativePath: string;
  name: string;
  isDir: boolean;
  size: number;
  modified?: string;
  depth: number;
}

const EPISODE_REGEXP = /e(\d{1,3})/i;
const SEASON_REGEXP = /s(\d{1,2})/i;

const ensureEpisodeMap = (map: ExistingEpisodeMap, season: number, episode: number) => {
  if (!map.seasons[season]) {
    map.seasons[season] = {};
  }
  map.seasons[season][episode] = true;
};

const parseSeasonEpisode = (dirName: string, fileName: string) => {
  const seasonMatch = dirName.match(SEASON_REGEXP) || fileName.match(SEASON_REGEXP);
  const episodeMatch = fileName.match(EPISODE_REGEXP);
  const season = seasonMatch ? Number(seasonMatch[1]) : 1;
  const episode = episodeMatch ? Number(episodeMatch[1]) : 0;
  return { season, episode };
};

const toRelativePath = (rootPath: string, targetPath: string) => {
  const relative = path.posix.relative(rootPath, targetPath);
  return relative || '.';
};

export const ensureOpenlistDirExists = async (sdk: OpenlistSdk, targetPath: string) => {
  const normalizedTargetPath = path.posix.normalize(String(targetPath || '').trim());
  if (!normalizedTargetPath || normalizedTargetPath === '.') {
    return false;
  }

  const segments = normalizedTargetPath.split('/').filter(Boolean);
  if (segments.length === 0) {
    return false;
  }

  let currentPath = normalizedTargetPath.startsWith('/') ? '/' : '';
  for (const segment of segments) {
    currentPath = currentPath === '/' ? `/${segment}` : currentPath ? path.posix.join(currentPath, segment) : segment;
    try {
      await sdk.listFs({ path: currentPath, refresh: true });
    } catch {
      await sdk.mkdir({ path: currentPath });
    }
  }

  return true;
};

const walkLibrary = async (
  sdk: OpenlistSdk,
  rootPath: string,
  currentPath: string,
  depth: number,
  map: ExistingEpisodeMap,
  entries: AnimeLibraryEntry[]
) => {
  const list = await sdk.listFs({ path: currentPath, refresh: true });

  for (const entry of list.content || []) {
    const fullPath = path.posix.join(currentPath, entry.name);
    entries.push({
      path: fullPath,
      relativePath: toRelativePath(rootPath, fullPath),
      name: entry.name,
      isDir: entry.is_dir,
      size: Number(entry.size || 0),
      modified: entry.modified,
      depth,
    });

    if (entry.is_dir) {
      await walkLibrary(sdk, rootPath, fullPath, depth + 1, map, entries);
      continue;
    }

    const parsed = parseSeasonEpisode(path.posix.basename(path.posix.dirname(fullPath)), entry.name);
    if (parsed.episode > 0) {
      ensureEpisodeMap(map, parsed.season, parsed.episode);
    }
    map.files.push(fullPath);
  }
};

export const scanExistingAnimeLibrary = async (seriesRootPath: string) => {
  const account = await getOpenlistAccountConfig();
  const sdk = createOpenlistSdk({ apiHost: account.baseUrl });
  await sdk.loginWithHashedPassword(account.username, account.password);

  if (!String(seriesRootPath || '').trim()) {
    return {
      sdk,
      rootExists: false,
      existingEpisodeMap: {} as Record<number, Record<number, boolean>>,
      files: [] as string[],
      entries: [] as AnimeLibraryEntry[],
    };
  }

  const map: ExistingEpisodeMap = {
    seasons: {},
    files: [],
  };
  const entries: AnimeLibraryEntry[] = [];
  try {
    await sdk.listFs({ path: seriesRootPath, refresh: true });
    await walkLibrary(sdk, seriesRootPath, seriesRootPath, 1, map, entries);
  } catch {
    return {
      sdk,
      rootExists: false,
      existingEpisodeMap: map.seasons,
      files: map.files,
      entries,
    };
  }

  return {
    sdk,
    rootExists: true,
    existingEpisodeMap: map.seasons,
    files: map.files,
    entries,
  };
};
