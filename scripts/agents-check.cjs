#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MAX_CODE_LINES = 500;
const MAX_DIR_CHILDREN = 50;

const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs', '.css', '.scss', '.html']);

const SKIP_PATH_SEGMENTS = [
  `${path.sep}.git${path.sep}`,
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}dist${path.sep}`,
  `${path.sep}.turbo${path.sep}`,
  `${path.sep}coverage${path.sep}`,
];

const SKIP_DIR_NAMES = new Set(['.git', 'node_modules', 'dist', '.turbo', 'coverage']);

const isSkippedPath = filePath => {
  return SKIP_PATH_SEGMENTS.some(segment => filePath.includes(segment));
};

const isCodeFile = fileName => {
  return CODE_EXTENSIONS.has(path.extname(fileName));
};

const countLines = filePath => {
  const text = fs.readFileSync(filePath, 'utf8');
  return text.split('\n').length;
};

const codeViolations = [];
const folderViolations = [];

const walk = dirPath => {
  if (isSkippedPath(dirPath)) {
    return;
  }

  let entries = [];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  const effectiveChildren = entries.filter(entry => !SKIP_DIR_NAMES.has(entry.name));
  if (effectiveChildren.length > MAX_DIR_CHILDREN) {
    folderViolations.push({
      childCount: effectiveChildren.length,
      path: dirPath,
    });
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIR_NAMES.has(entry.name)) {
        continue;
      }
      walk(fullPath);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }
    if (!isCodeFile(entry.name)) {
      continue;
    }
    if (isSkippedPath(fullPath)) {
      continue;
    }

    try {
      const lineCount = countLines(fullPath);
      if (lineCount > MAX_CODE_LINES) {
        codeViolations.push({
          lineCount,
          path: fullPath,
        });
      }
    } catch {
      // ignore unreadable/non-utf8 files
    }
  }
};

walk(ROOT);

codeViolations.sort((a, b) => b.lineCount - a.lineCount);
folderViolations.sort((a, b) => b.childCount - a.childCount);

if (codeViolations.length === 0 && folderViolations.length === 0) {
  console.log('AGENTS check passed.');
  process.exit(0);
}

if (codeViolations.length > 0) {
  console.log('Code file violations (> 500 lines):');
  for (const item of codeViolations) {
    console.log(`- ${item.lineCount}: ${item.path}`);
  }
}

if (folderViolations.length > 0) {
  console.log('Folder violations (> 50 direct children):');
  for (const item of folderViolations) {
    console.log(`- ${item.childCount}: ${item.path}`);
  }
}

process.exit(1);
