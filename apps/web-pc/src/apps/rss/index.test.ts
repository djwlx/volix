import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const styleFile = path.resolve(__dirname, 'index.module.scss');
const styleText = fs.readFileSync(styleFile, 'utf-8');

describe('rss reader layout styles', () => {
  it('reserves more space for reading and keeps a compact mobile toolbar', () => {
    expect(styleText).toContain('grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);');
    expect(styleText).toContain('.toolbarMeta');
    expect(styleText).toContain('.detailHeader');
    expect(styleText).toContain('.detailBadgeRow');
    expect(styleText).toContain('.metaBadge');
    expect(styleText).toContain('.routeSelectDropdown');
    expect(styleText).toContain('.routeOption');
    expect(styleText).toContain('.routeOptionTitle');
    expect(styleText).toContain('.routeOptionUrl');
    expect(styleText).toContain('text-overflow: ellipsis;');
    expect(styleText).toContain('background: transparent;');
    expect(styleText).toContain('@media (max-width: 767px)');
    expect(styleText).toContain('.toolbarMeta {\n    display: none;');
    expect(styleText).toContain('.detailActions {\n    width: 100%;');
  });
});
