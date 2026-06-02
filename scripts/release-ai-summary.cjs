#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const DEFAULT_CHANGELOG_PATH = path.join(repoRoot, 'CHANGELOG.md');
const DEFAULT_RELEASE_NOTES_PATH = path.join(repoRoot, 'release-notes.md');
const DEFAULT_CHANGELOG_PREVIEW_PATH = path.join(repoRoot, 'CHANGELOG.generated.md');
const DEFAULT_RELEASE_NOTES_PREVIEW_PATH = path.join(repoRoot, 'release-notes.generated.md');
const MAX_COMMITS = 80;
const MAX_FILES = 200;
const MAX_DIFF_STAT_LINES = 200;
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions';

function run(cmd, options = {}) {
  return execSync(cmd, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim();
}

function shellEscape(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function parseArgs(argv) {
  const args = {
    changelogPath: DEFAULT_CHANGELOG_PATH,
    releaseNotesPath: DEFAULT_RELEASE_NOTES_PATH,
    changelogPreviewPath: '',
    dryRun: false,
    skipChangelog: false,
    print: false,
    preview: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--tag') {
      args.tag = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--changelog') {
      args.changelogPath = path.resolve(repoRoot, argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === '--release-notes') {
      args.releaseNotesPath = path.resolve(repoRoot, argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === '--changelog-preview') {
      args.changelogPreviewPath = path.resolve(repoRoot, argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    if (token === '--skip-changelog') {
      args.skipChangelog = true;
      continue;
    }
    if (token === '--print') {
      args.print = true;
      continue;
    }
    if (token === '--preview') {
      args.preview = true;
      continue;
    }
  }

  if (!args.tag) {
    throw new Error('缺少 --tag 参数');
  }

  return args;
}

function normalizeTag(tag) {
  const normalized = String(tag || '').trim();
  if (!/^v\d+\.\d+\.\d+$/.test(normalized)) {
    throw new Error(`tag 格式非法: ${tag}`);
  }
  return normalized;
}

function getVersionFromTag(tag) {
  return tag.replace(/^v/, '');
}

function getPreviousTag(currentTag) {
  try {
    return run(`git describe --tags --abbrev=0 ${shellEscape(`${currentTag}^`)}`);
  } catch {
    return '';
  }
}

function uniqueLines(input) {
  return [...new Set(input.split('\n').map(item => item.trim()).filter(Boolean))];
}

function getReleaseContext(currentTag, previousTag) {
  const range = previousTag ? `${previousTag}..${currentTag}` : currentTag;
  const commitsRaw = run(
    `git log ${range} --no-merges --pretty=format:%h%x09%s%x09%an --max-count=${MAX_COMMITS}`
  );
  const commits = commitsRaw
    ? commitsRaw.split('\n').map(line => {
        const [hash = '', subject = '', author = ''] = line.split('\t');
        return { hash, subject, author };
      })
    : [];

  let files = [];
  if (previousTag) {
    const filesRaw = run(`git diff --name-status ${shellEscape(previousTag)} ${shellEscape(currentTag)}`);
    files = filesRaw
      ? filesRaw.split('\n').slice(0, MAX_FILES).map(line => {
          const [status = '', ...rest] = line.split('\t');
          return { status, path: rest.join(' -> ') };
        })
      : [];
  } else {
    const filesRaw = run(`git log ${range} --name-only --pretty=format:`);
    files = uniqueLines(filesRaw)
      .slice(0, MAX_FILES)
      .map(filePath => ({ status: 'A', path: filePath }));
  }

  let diffStat = '';
  if (previousTag) {
    diffStat = run(`git diff --stat=160 ${shellEscape(previousTag)} ${shellEscape(currentTag)}`);
  } else {
    diffStat = files.map(file => `${file.status}\t${file.path}`).join('\n');
  }

  return {
    previousTag,
    currentTag,
    commits,
    files,
    diffStat: diffStat
      .split('\n')
      .filter(Boolean)
      .slice(0, MAX_DIFF_STAT_LINES)
      .join('\n'),
  };
}

function buildPrompt(context, version, releaseDate) {
  const commitLines = context.commits.length
    ? context.commits.map(item => `- ${item.hash} ${item.subject} (${item.author})`).join('\n')
    : '- No commits found';
  const fileLines = context.files.length
    ? context.files.map(item => `- [${item.status}] ${item.path}`).join('\n')
    : '- No changed files found';

  return [
    `当前发布版本: ${version}`,
    `当前 tag: ${context.currentTag}`,
    `上一个 tag: ${context.previousTag || 'none'}`,
    `发布日期: ${releaseDate}`,
    '',
    '请根据以下 git 变更信息，总结本次版本相比上一个版本的用户可见变化和技术改动，并同时输出中文和英文版本，要求两种语言表达同一组信息。',
    '要求：',
    '1. 输出必须是 JSON 对象，不要加代码块。',
    '2. 仅根据给定上下文总结，不要虚构功能。',
    '3. 中文和英文的分类、条目数量、信息点要一致，只允许语言不同。',
    '4. 变更分类仅允许 added、changed、fixed，没内容时返回空数组。',
    '5. release_highlights 适合 GitHub Release，保留 3-8 条高价值要点。',
    '6. 文风简洁、具体、面向发布说明，不要写空话。',
    '',
    '返回 JSON 结构：',
    '{"summary_zh":{"release_title":"...","added":["..."],"changed":["..."],"fixed":["..."],"release_highlights":["..."]},"summary_en":{"release_title":"...","added":["..."],"changed":["..."],"fixed":["..."],"release_highlights":["..."]}}',
    '',
    '[Commit List]',
    commitLines,
    '',
    '[Changed Files]',
    fileLines,
    '',
    '[Diff Stat]',
    context.diffStat || 'No diff stat available',
  ].join('\n');
}

async function requestDeepSeekSummary(prompt, apiKey) {
  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            '你是一个软件发布工程师，负责根据 git 变更总结准确、简洁的版本说明。输出必须是合法 JSON，对未知内容保持克制。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_object',
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DeepSeek API 请求失败: ${response.status} ${body}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('DeepSeek 未返回内容');
  }
  return parseJsonPayload(content);
}

function parseJsonPayload(content) {
  const normalized = String(content || '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '');

  const parsed = JSON.parse(normalized);
  const summaryZh = normalizeSummary(parsed?.summary_zh, '中文');
  const summaryEn = normalizeSummary(parsed?.summary_en, '英文');

  return { summaryZh, summaryEn };
}

function buildFallbackSummary(context, version, releaseDate) {
  const zhHighlights = [
    `对比 ${context.previousTag || '项目起始版本'} 汇总了本次发布内容。`,
    ...context.commits.slice(0, 6).map(item => item.subject),
  ].slice(0, 7);
  const enHighlights = [
    `Summarized this release against ${context.previousTag || 'the initial project version'}.`,
    ...context.commits.slice(0, 6).map(item => item.subject),
  ].slice(0, 7);

  return {
    summaryZh: {
      releaseTitle: `Volix ${version} 发布说明`,
      added: [],
      changed: [`自动 AI 总结不可用，以下内容回退为提交主题摘要。`],
      fixed: [],
      releaseHighlights: zhHighlights,
    },
    summaryEn: {
      releaseTitle: `Volix ${version} Release Notes`,
      added: [],
      changed: ['AI summarization was unavailable, so the content falls back to commit subject highlights.'],
      fixed: [],
      releaseHighlights: enHighlights,
    },
  };
}

function normalizeSummary(summary, languageLabel) {
  const releaseTitle = String(summary?.release_title || '').trim();
  const added = toStringArray(summary?.added);
  const changed = toStringArray(summary?.changed);
  const fixed = toStringArray(summary?.fixed);
  const releaseHighlights = toStringArray(summary?.release_highlights);

  if (!releaseTitle || !releaseHighlights.length) {
    throw new Error(`AI 返回的${languageLabel}摘要不完整`);
  }

  return {
    releaseTitle,
    added,
    changed,
    fixed,
    releaseHighlights,
  };
}

function toStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map(item => String(item || '').trim()).filter(Boolean);
}

function renderCategory(title, items, headingLevel = '####') {
  if (!items.length) {
    return '';
  }
  return [`${headingLevel} ${title}`, ...items.map(item => `- ${item}`)].join('\n');
}

function renderChangelogSection(version, releaseDate, summaryZh, summaryEn) {
  const zhBlocks = [
    renderCategory('Added', summaryZh.added),
    renderCategory('Changed', summaryZh.changed),
    renderCategory('Fixed', summaryZh.fixed),
  ].filter(Boolean);
  const enBlocks = [
    renderCategory('Added', summaryEn.added),
    renderCategory('Changed', summaryEn.changed),
    renderCategory('Fixed', summaryEn.fixed),
  ].filter(Boolean);

  return [
    `## [${version}] - ${releaseDate}`,
    '',
    '### 中文',
    ...(zhBlocks.length ? zhBlocks : ['- 无']),
    '',
    '### English',
    ...(enBlocks.length ? enBlocks : ['- None']),
  ].join('\n');
}

function renderReleaseNotes(version, summaryZh, summaryEn) {
  return [
    `## Volix ${version}`,
    '',
    '### 中文',
    ...summaryZh.releaseHighlights.map(item => `- ${item}`),
    '',
    '### English',
    ...summaryEn.releaseHighlights.map(item => `- ${item}`),
  ].join('\n');
}

function updateChangelog(changelogPath, version, sectionMarkdown) {
  const content = fs.readFileSync(changelogPath, 'utf8');
  const versionHeader = `## [${version}]`;
  if (content.includes(versionHeader)) {
    return false;
  }

  const unreleasedHeader = '## [Unreleased]';
  const unreleasedIndex = content.indexOf(unreleasedHeader);
  if (unreleasedIndex === -1) {
    throw new Error('CHANGELOG.md 缺少 `## [Unreleased]` 段落');
  }

  const afterUnreleased = unreleasedIndex + unreleasedHeader.length;
  const nextSectionMatch = /^## \[(?!Unreleased\]).+$/m.exec(content.slice(afterUnreleased));
  const insertIndex = nextSectionMatch ? afterUnreleased + nextSectionMatch.index : content.length;
  const insertion = `\n\n${sectionMarkdown.trim()}\n`;
  const nextContent = `${content.slice(0, insertIndex)}${insertion}${content.slice(insertIndex).replace(/^\n+/, '\n')}`;
  fs.writeFileSync(changelogPath, nextContent.trimEnd() + '\n');
  return true;
}

function writeReleaseNotes(filePath, content) {
  fs.writeFileSync(filePath, `${content.trim()}\n`);
}

function writePreviewFile(filePath, title, content) {
  fs.writeFileSync(filePath, [`# ${title}`, '', content.trim(), ''].join('\n'));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const currentTag = normalizeTag(args.tag);
  const version = getVersionFromTag(currentTag);
  const releaseDate = new Date().toISOString().slice(0, 10);
  const previousTag = getPreviousTag(currentTag);
  const context = getReleaseContext(currentTag, previousTag);

  console.log(`> current tag: ${currentTag}`);
  console.log(`> previous tag: ${previousTag || 'none'}`);
  console.log(`> commits: ${context.commits.length}`);
  console.log(`> changed files: ${context.files.length}`);

  let summary;
  if (args.dryRun) {
    console.log('> dry-run mode enabled, skip DeepSeek request');
    summary = buildFallbackSummary(context, version, releaseDate);
  } else {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('缺少环境变量 DEEPSEEK_API_KEY');
    }
    const prompt = buildPrompt(context, version, releaseDate);
    summary = await requestDeepSeekSummary(prompt, apiKey);
  }

  const changelogSection = renderChangelogSection(version, releaseDate, summary.summaryZh, summary.summaryEn);
  const releaseNotes = renderReleaseNotes(version, summary.summaryZh, summary.summaryEn);
  const effectiveReleaseNotesPath =
    args.preview && args.releaseNotesPath === DEFAULT_RELEASE_NOTES_PATH
      ? DEFAULT_RELEASE_NOTES_PREVIEW_PATH
      : args.releaseNotesPath;
  const changelogUpdated = args.skipChangelog ? false : updateChangelog(args.changelogPath, version, changelogSection);
  writeReleaseNotes(effectiveReleaseNotesPath, releaseNotes);

  if (args.preview) {
    const changelogPreviewPath = args.changelogPreviewPath || DEFAULT_CHANGELOG_PREVIEW_PATH;
    writePreviewFile(changelogPreviewPath, `Changelog Preview ${version}`, changelogSection);
    console.log(`> changelog preview written: ${path.relative(repoRoot, changelogPreviewPath)}`);
    console.log(`> release notes preview written: ${path.relative(repoRoot, effectiveReleaseNotesPath)}`);
  }

  console.log(`> changelog updated: ${args.skipChangelog ? 'skipped' : changelogUpdated ? 'yes' : 'no (version section exists)'}`);
  console.log(`> release notes written: ${path.relative(repoRoot, effectiveReleaseNotesPath)}`);
  if (args.print) {
    console.log('--- CHANGELOG SECTION ---');
    console.log(changelogSection);
    console.log('--- RELEASE NOTES ---');
    console.log(releaseNotes);
  }
}

main().catch(error => {
  console.error(`生成发布摘要失败: ${(error && error.message) || error}`);
  process.exit(1);
});
