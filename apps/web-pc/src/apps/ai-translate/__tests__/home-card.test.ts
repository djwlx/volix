import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/utils', () => ({
  isAuthenticated: () => true,
}));

vi.mock('@/hooks', () => ({
  useUser: () => ({
    user: {
      role: 'user',
    },
  }),
}));

vi.mock('@douyinfe/semi-icons', () => ({
  IconArticle: () => createElement('span', null, 'article'),
  IconStar: () => createElement('span', null, 'star'),
  IconTabsStroked: () => createElement('span', null, 'tabs'),
}));

vi.mock('@/assets/icons/formatter.svg', () => ({
  default: 'formatter.svg',
}));

vi.mock('@/assets/icons/color-picker.svg', () => ({
  default: 'color-picker.svg',
}));

vi.mock('@/assets/icons/pic.svg', () => ({
  default: 'pic.svg',
}));

vi.mock('@/assets/icons/admin.svg', () => ({
  default: 'admin.svg',
}));

vi.mock('../../home/components', () => ({
  AppCard: ({ title, description, link }: { title: string; description?: string; link?: string }) =>
    createElement('article', { 'data-link': link }, `${title}|${description || ''}`),
}));

describe('home ai translate card', () => {
  it('adds the ai translate card to the tools section', async () => {
    const { default: HomeApp } = await import('../../home/index');
    const markup = renderToStaticMarkup(createElement(HomeApp));

    expect(markup).toContain('home.card.aiTranslate.title');
    expect(markup).toContain('home.card.aiTranslate.description');
    expect(markup).toContain('/ai-translate');
  });
});
