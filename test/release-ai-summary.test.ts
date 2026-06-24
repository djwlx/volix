import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { afterEach, describe, expect, test } from 'vitest';
import { createRequire } from 'module';

const scriptPath = path.resolve(process.cwd(), 'scripts/release-ai-summary.cjs');
const require = createRequire(import.meta.url);
const { resolveReleaseBaselineTag } = require('../scripts/release-baseline.cjs');
const makeTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'volix-release-ai-summary-'));

describe('release ai summary script', () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map(dirPath => fs.promises.rm(dirPath, { recursive: true, force: true })));
  });

  test('writes versioned bilingual changelog sections without unreleased or top boilerplate', () => {
    const tempDir = makeTempDir();
    tempDirs.push(tempDir);

    const changelogPath = path.join(tempDir, 'CHANGELOG.md');
    const releaseNotesPath = path.join(tempDir, 'release-notes.md');

    fs.writeFileSync(
      changelogPath,
      ['# Changelog', '', 'All notable changes to this project will be documented in this file.', ''].join('\n'),
      'utf8'
    );

    execFileSync(
      'node',
      [scriptPath, '--tag', 'v1.1.3', '--changelog', changelogPath, '--release-notes', releaseNotesPath, '--dry-run'],
      {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'pipe',
      }
    );

    const changelogContent = fs.readFileSync(changelogPath, 'utf8');
    const releaseNotesContent = fs.readFileSync(releaseNotesPath, 'utf8');

    expect(changelogContent).not.toContain('All notable changes to this project will be documented in this file.');
    expect(changelogContent).not.toContain('## [Unreleased]');
    expect(changelogContent).toContain('## [1.1.3] - ');
    expect(changelogContent).toContain('### 中文');
    expect(changelogContent).toContain('### English');
    expect(releaseNotesContent).toContain('### 中文');
    expect(releaseNotesContent).toContain('### English');
  });

  test('prefers previous successful GitHub release tag over previous git tag', async () => {
    const result = await resolveReleaseBaselineTag({
      currentTag: 'v1.1.3',
      repository: 'volix/volix',
      token: 'test-token',
      fetchImpl: async () => ({
        ok: true,
        async json() {
          return [
            { tag_name: 'v1.1.3', draft: false, prerelease: false },
            { tag_name: 'v1.1.1', draft: false, prerelease: false },
          ];
        },
      }),
      runCommand: () => 'v1.1.2',
      logger: console,
    });

    expect(result).toEqual({
      baselineTag: 'v1.1.1',
      baselineSource: 'github-release',
    });
  });

  test('falls back to previous git tag when GitHub release lookup is unavailable', async () => {
    const result = await resolveReleaseBaselineTag({
      currentTag: 'v1.1.3',
      repository: 'volix/volix',
      fetchImpl: async () => ({
        ok: false,
        status: 500,
      }),
      runCommand: () => 'v1.1.2',
      logger: { warn() {} },
    });

    expect(result).toEqual({
      baselineTag: 'v1.1.2',
      baselineSource: 'git-tag',
    });
  });
});
