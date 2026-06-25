// @vitest-environment jsdom

import { act, createElement } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  get115Pic: vi.fn(),
  get115PicFromCacheCid: vi.fn(),
  get115PicFromParent: vi.fn(),
  like115Pic: vi.fn(),
  get115PicPathByPc: vi.fn(),
  get115FileList: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock('react-router', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useSearchParams: () => [mocked.searchParams, vi.fn()],
  };
});

vi.mock('@douyinfe/semi-ui', () => ({
  Button: ({ children, onClick, disabled }: { children?: ReactNode; onClick?: () => void; disabled?: boolean }) =>
    createElement('button', { disabled, onClick }, children),
  Image: ({ src }: { src: string }) => createElement('img', { src, alt: 'pic' }),
  Space: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  Switch: ({ checked, onChange }: { checked?: boolean; onChange?: (checked: boolean) => void }) =>
    createElement('input', { type: 'checkbox', checked, onChange: () => onChange?.(!checked) }),
  Toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
  Tooltip: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  Typography: {
    Text: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
  },
}));

vi.mock('@/services/115', () => ({
  get115FileList: mocked.get115FileList,
  get115Pic: mocked.get115Pic,
  get115PicFromCacheCid: mocked.get115PicFromCacheCid,
  get115PicFromParent: mocked.get115PicFromParent,
  get115PicPathByPc: mocked.get115PicPathByPc,
  like115Pic: mocked.like115Pic,
}));

vi.mock('@/components', () => ({
  Loading: ({ text }: { text?: string }) => createElement('div', null, text || 'loading'),
}));

vi.mock('@/utils/error', () => ({
  getHttpErrorMessage: () => 'error',
}));

vi.mock('@/hooks', () => ({
  useUser: () => ({
    user: {
      role: 'admin',
    },
  }),
}));

vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      key === 'pic.autoPlay.summary' ? `${key}:${String(params?.seconds || '')}` : key,
  }),
}));

describe('pic app', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    mocked.searchParams = new URLSearchParams();
    mocked.get115Pic.mockResolvedValue({
      data: {
        url: 'https://img.example/global.jpg',
        fileName: 'global.jpg',
        cid: 'global-cid',
        pc: 'global-pc',
        path: '/Global/global.jpg',
        parentPath: '/Global',
        liked: false,
        autoPlayIntervalSeconds: 10,
      },
    });
    mocked.get115PicFromCacheCid.mockResolvedValue({
      data: {
        url: 'https://img.example/cache.jpg',
        fileName: 'cache.jpg',
        cid: 'cache-cid',
        pc: 'cache-pc',
        path: '/Cache/cache.jpg',
        parentPath: '/Cache',
        liked: false,
        autoPlayIntervalSeconds: 10,
      },
    });
    mocked.get115PicFromParent.mockResolvedValue({ data: {} });
    mocked.like115Pic.mockResolvedValue({ data: { liked: true } });
    mocked.get115PicPathByPc.mockResolvedValue({ data: { path: '/Cache/cache.jpg', liked: false } });
    mocked.get115FileList.mockResolvedValue({ data: { path: [] } });

    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    document.body.innerHTML = '';
  });

  it('loads first picture from cache folder when cid query param exists', async () => {
    mocked.searchParams = new URLSearchParams('cid=cache-cid');
    const { default: PicApp } = await import('../index');

    await act(async () => {
      root.render(createElement(PicApp));
    });

    expect(mocked.get115PicFromCacheCid).toHaveBeenCalledWith('cache-cid');
    expect(mocked.get115Pic).not.toHaveBeenCalled();
  });

  it('keeps next action on global random even after cache-folder bootstrap', async () => {
    mocked.searchParams = new URLSearchParams('cid=cache-cid');
    const { default: PicApp } = await import('../index');

    await act(async () => {
      root.render(createElement(PicApp));
    });

    const nextButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent === 'pic.action.next'
    );
    expect(nextButton).toBeTruthy();

    await act(async () => {
      nextButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mocked.get115Pic).toHaveBeenCalledTimes(1);
  });
});
