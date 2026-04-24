#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function run(cmd, options = {}) {
  return execSync(cmd, {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim();
}

function runInherit(cmd) {
  execSync(cmd, {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
  });
}

function parseVersion(input) {
  const normalized = String(input || '')
    .trim()
    .replace(/^v/, '');
  const match = normalized.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    return null;
  }
  return {
    raw: normalized,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function compareVersion(a, b) {
  if (a.major !== b.major) {
    return a.major - b.major;
  }
  if (a.minor !== b.minor) {
    return a.minor - b.minor;
  }
  return a.patch - b.patch;
}

function formatVersion(version) {
  return `${version.major}.${version.minor}.${version.patch}`;
}

function bumpPatch(version) {
  return {
    major: version.major,
    minor: version.minor,
    patch: version.patch + 1,
  };
}

function bumpMinor(version) {
  return {
    major: version.major,
    minor: version.minor + 1,
    patch: 0,
  };
}

function bumpMajor(version) {
  return {
    major: version.major + 1,
    minor: 0,
    patch: 0,
  };
}

function resolveBumpType(rawType) {
  const normalized = String(rawType || 'patch')
    .trim()
    .toLowerCase();
  if (!normalized) {
    return 'patch';
  }
  if (['patch', 'minor', 'major'].includes(normalized)) {
    return normalized;
  }
  throw new Error(`不支持的版本类型: ${rawType}，只允许 patch、minor、major`);
}

function getRootPackageVersion() {
  const pkgPath = path.resolve(__dirname, '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const version = parseVersion(pkg.version);
  if (!version) {
    throw new Error(`根 package.json 的 version 非法: ${pkg.version}`);
  }
  return version;
}

function getLatestGitTagVersion() {
  const output = run('git tag --list "v*" --sort=-version:refname');
  const tags = output
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean);

  for (const tag of tags) {
    const version = parseVersion(tag);
    if (version) {
      return {
        tag,
        version,
      };
    }
  }

  return null;
}

function ensureCleanWorktree() {
  const status = run('git status --porcelain');
  if (status) {
    throw new Error('当前工作区不干净，请先提交或暂存改动后再打 tag。');
  }
}

function ensureOnBranch() {
  const branch = run('git branch --show-current');
  if (!branch) {
    throw new Error('当前不在分支上，无法直接推送提交。');
  }
  return branch;
}

function main() {
  const bumpType = resolveBumpType(process.argv[2]);
  ensureCleanWorktree();
  const branch = ensureOnBranch();

  console.log('> git fetch --tags --force');
  runInherit('git fetch --tags --force');

  const packageVersion = getRootPackageVersion();
  const latestTag = getLatestGitTagVersion();
  const baseVersion =
    latestTag && compareVersion(latestTag.version, packageVersion) > 0 ? latestTag.version : packageVersion;
  const nextVersion =
    bumpType === 'major'
      ? bumpMajor(baseVersion)
      : bumpType === 'minor'
      ? bumpMinor(baseVersion)
      : bumpPatch(baseVersion);
  const nextTag = `v${formatVersion(nextVersion)}`;

  const existingTag = run(`git tag --list "${nextTag}"`);
  if (existingTag) {
    throw new Error(`tag 已存在: ${nextTag}`);
  }

  console.log(`package.json 版本: v${formatVersion(packageVersion)}`);
  console.log(`最新 git tag: ${latestTag?.tag || '无'}`);
  console.log(`版本升级类型: ${bumpType}`);
  console.log(`将创建新 tag: ${nextTag}`);

  console.log(`> git tag -a ${nextTag} -m "release: ${nextTag}"`);
  runInherit(`git tag -a ${nextTag} -m "release: ${nextTag}"`);

  console.log(`> git push origin ${branch}`);
  runInherit(`git push origin ${branch}`);

  console.log(`> git push origin ${nextTag}`);
  runInherit(`git push origin ${nextTag}`);

  console.log(`✓ 已完成发布 tag: ${nextTag}`);
}

try {
  main();
} catch (error) {
  console.error(`发布失败: ${(error && error.message) || error}`);
  process.exit(1);
}
