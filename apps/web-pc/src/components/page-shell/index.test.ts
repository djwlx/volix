// @vitest-environment jsdom

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PageShell } from './index';

describe('page shell', () => {
  it('wraps content with the shared page padding', () => {
    const markup = renderToStaticMarkup(createElement(PageShell, null, createElement('span', null, 'content')));

    expect(markup).toContain('padding:24px 16px 32px');
    expect(markup).toContain('width:100%');
    expect(markup).toContain('content');
  });
});
