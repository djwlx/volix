import { createElement } from 'react';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@douyinfe/semi-ui', () => ({
  Card: ({
    title,
    children,
    bodyStyle,
    className,
  }: {
    title?: ReactNode;
    children?: ReactNode;
    bodyStyle?: Record<string, unknown>;
    className?: string;
  }) =>
    createElement(
      'section',
      {
        'data-card-title-provided': title ? 'true' : 'false',
        'data-body-width': String(bodyStyle?.width || ''),
        className,
      },
      children
    ),
}));

describe('page card', () => {
  it('renders the heading itself without passing title to the underlying card', async () => {
    const { PageCard } = await import('./index');

    const markup = renderToStaticMarkup(
      createElement(
        PageCard,
        {
          title: 'Profile',
          bodyStyle: { width: '100%' },
        },
        createElement('div', null, 'content')
      )
    );

    expect(markup).toContain('Profile');
    expect(markup).toContain('content');
    expect(markup).toContain('data-card-title-provided="false"');
    expect(markup).toContain('data-body-width="100%"');
  });
});
