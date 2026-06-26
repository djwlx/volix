import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  analyzeComicArchive,
  fillComicMetadataForArchive,
} from '../../apps/api/src/modules/format-convert/service/format-convert-comic.service';

const tmpDir = path.join(os.tmpdir(), `volix-comic-metadata-${Date.now()}`);
const sourceZipPath = path.join(tmpDir, 'demo.zip');
const sourceCbzPath = path.join(tmpDir, 'demo.cbz');
const outputCbzPath = path.join(tmpDir, 'output.cbz');
const sourceZipDir = path.join(tmpDir, 'source-zip');
const sourceCbzDir = path.join(tmpDir, 'source-cbz');

const execFileAsync = promisify(execFile);

const COMIC_INFO_XML = `<?xml version="1.0" encoding="utf-8"?>
<ComicInfo>
  <Title>Existing Title</Title>
  <Series>Existing Series</Series>
  <Number>1</Number>
</ComicInfo>`;

beforeAll(async () => {
  await fs.promises.mkdir(tmpDir, { recursive: true });
  await fs.promises.mkdir(sourceZipDir, { recursive: true });
  await fs.promises.mkdir(sourceCbzDir, { recursive: true });

  await fs.promises.writeFile(path.join(sourceZipDir, '001.jpg'), Buffer.from('page-1'));
  await fs.promises.writeFile(path.join(sourceZipDir, '002.jpg'), Buffer.from('page-2'));
  await execFileAsync('zip', ['-q', '-r', sourceZipPath, '.'], { cwd: sourceZipDir });

  await fs.promises.writeFile(path.join(sourceCbzDir, '001.jpg'), Buffer.from('page-1'));
  await fs.promises.writeFile(path.join(sourceCbzDir, 'ComicInfo.xml'), Buffer.from(COMIC_INFO_XML, 'utf8'));
  await execFileAsync('zip', ['-q', '-r', sourceCbzPath, '.'], { cwd: sourceCbzDir });
});

afterAll(async () => {
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe('format convert comic service', () => {
  it('detects archive extension and ComicInfo presence', async () => {
    const result = await analyzeComicArchive(sourceZipPath);

    expect(result.archiveFormat).toBe('zip');
    expect(result.fileExtension).toBe('.zip');
    expect(result.expectedExtension).toBe('.cbz');
    expect(result.extensionMatches).toBe(false);
    expect(result.hasComicInfo).toBe(false);
    expect(result.imageCount).toBe(2);
    expect(result.pageCount).toBe(2);
  });

  it('writes common ComicInfo fields into a cbz result', async () => {
    await fillComicMetadataForArchive({
      sourcePath: sourceCbzPath,
      outputPath: outputCbzPath,
      metadata: {
        title: 'Batman Vol. 1',
        series: 'Batman',
        number: '12',
        volume: '1',
        writer: 'Jeph Loeb',
        penciller: 'Tim Sale',
        inker: 'Tim Sale',
        colorist: 'Gregory Wright',
        letterer: 'Todd Klein',
        publisher: 'DC Comics',
        summary: 'A long Halloween mystery.',
        genres: ['Mystery', 'Superhero'],
        tags: ['Gotham', 'Holiday'],
        characters: ['Batman', 'Catwoman'],
        teams: ['Justice League'],
        locations: ['Gotham City'],
        storyArc: 'The Long Halloween',
        seriesGroup: 'Batman Classics',
        ageRating: 'Teen',
        languageISO: 'zh',
        year: 2024,
        month: 6,
        day: 15,
        blackAndWhite: false,
        manga: 'No',
      },
    });

    const result = await analyzeComicArchive(outputCbzPath);

    expect(result.fileExtension).toBe('.cbz');
    expect(result.extensionMatches).toBe(true);
    expect(result.hasComicInfo).toBe(true);
    expect(result.comicInfo?.title).toBe('Batman Vol. 1');
    expect(result.comicInfo?.series).toBe('Batman');
    expect(result.comicInfo?.writer).toBe('Jeph Loeb');
    expect(result.comicInfo?.publisher).toBe('DC Comics');
    expect(result.comicInfo?.genres).toEqual(['Mystery', 'Superhero']);
    expect(result.comicInfo?.tags).toEqual(['Gotham', 'Holiday']);
    expect(result.comicInfo?.characters).toEqual(['Batman', 'Catwoman']);
    expect(result.comicInfo?.languageISO).toBe('zh');
    expect(result.comicInfo?.manga).toBe('No');
  });
});
