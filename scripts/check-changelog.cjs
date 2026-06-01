#!/usr/bin/env node

const { execSync } = require('node:child_process');

const CHANGELOG_PATH = 'CHANGELOG.md';

function getStagedFiles() {
  const output = execSync('git diff --cached --name-only --diff-filter=ACMR', {
    encoding: 'utf8',
  });
  return output
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean);
}

function main() {
  const stagedFiles = getStagedFiles();
  if (stagedFiles.length === 0) {
    return;
  }

  const changelogUpdated = stagedFiles.includes(CHANGELOG_PATH);
  const hasOtherChanges = stagedFiles.some(filePath => filePath !== CHANGELOG_PATH);

  if (hasOtherChanges && !changelogUpdated) {
    console.error('[changelog-check] Detected staged updates without CHANGELOG.md.');
    console.error(`[changelog-check] Please update and stage ${CHANGELOG_PATH} before commit.`);
    process.exit(1);
  }
}

main();

