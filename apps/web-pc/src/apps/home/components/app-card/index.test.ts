import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const styleFile = path.resolve(__dirname, 'index.module.scss');
const styleText = fs.readFileSync(styleFile, 'utf-8');

describe('home app card styles', () => {
  it('clamps the description to three lines', () => {
    expect(styleText).toContain('-webkit-line-clamp: 3;');
    expect(styleText).toContain('overflow: hidden;');
    expect(styleText).toContain('display: -webkit-box;');
  });
});
