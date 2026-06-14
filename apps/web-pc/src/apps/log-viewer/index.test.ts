import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const styleFile = path.resolve(__dirname, 'index.module.scss');
const styleText = fs.readFileSync(styleFile, 'utf-8');

describe('log viewer mobile styles', () => {
  it('uses a stacked mobile layout for toolbar and log entries', () => {
    expect(styleText).toContain('@media (max-width: 767px)');
    expect(styleText).toContain('grid-template-columns: 4px minmax(0, 1fr);');
    expect(styleText).toContain('.actionButtons');
    expect(styleText).toContain('flex-direction: column;');
    expect(styleText).toContain('width: 100% !important;');
  });
});
