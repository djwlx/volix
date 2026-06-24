'use strict';

function shellEscape(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function normalizeRepository(repository) {
  const normalized = String(repository || '').trim();
  return /^[^/]+\/[^/]+$/.test(normalized) ? normalized : '';
}

function isVersionTag(tag) {
  return /^v\d+\.\d+\.\d+$/.test(String(tag || '').trim());
}

function getPreviousTag(currentTag, runCommand) {
  try {
    return runCommand(`git describe --tags --abbrev=0 ${shellEscape(`${currentTag}^`)}`);
  } catch {
    return '';
  }
}

async function fetchPreviousSuccessfulTag(options) {
  const repository = normalizeRepository(options?.repository);
  if (!repository) {
    return '';
  }

  const fetchImpl = options?.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    return '';
  }

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'volix-release-ai-summary',
  };
  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetchImpl(`https://api.github.com/repos/${repository}/releases?per_page=20`, {
    headers,
  });
  if (!response.ok) {
    throw new Error(`GitHub releases request failed: ${response.status}`);
  }

  const releases = await response.json();
  if (!Array.isArray(releases)) {
    return '';
  }

  const currentTag = String(options?.currentTag || '').trim();
  for (const release of releases) {
    if (release?.draft || release?.prerelease) {
      continue;
    }
    const tagName = String(release?.tag_name || '').trim();
    if (!isVersionTag(tagName) || tagName === currentTag) {
      continue;
    }
    return tagName;
  }

  return '';
}

async function resolveReleaseBaselineTag(options) {
  try {
    const baselineTag = await fetchPreviousSuccessfulTag(options);
    if (baselineTag) {
      return { baselineTag, baselineSource: 'github-release' };
    }
  } catch (error) {
    if (typeof options?.logger?.warn === 'function') {
      options.logger.warn(`> failed to resolve previous successful release: ${error.message || error}`);
    }
  }

  const previousTag = getPreviousTag(options?.currentTag, options?.runCommand);
  if (previousTag) {
    return { baselineTag: previousTag, baselineSource: 'git-tag' };
  }

  return { baselineTag: '', baselineSource: 'initial-version' };
}

module.exports = {
  fetchPreviousSuccessfulTag,
  getPreviousTag,
  resolveReleaseBaselineTag,
};
