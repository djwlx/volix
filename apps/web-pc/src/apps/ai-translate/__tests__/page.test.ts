// @vitest-environment jsdom

import { act, createElement } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  getAccountConfigs: vi.fn(),
  translateText: vi.fn(),
  navigate: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@douyinfe/semi-ui', () => ({
  Button: ({ children, onClick, loading }: { children?: ReactNode; onClick?: () => void; loading?: boolean }) =>
    createElement('button', { onClick, disabled: loading }, children),
  Empty: ({ title, description }: { title?: string; description?: string }) =>
    createElement('section', null, `${title || ''}${description || ''}`),
  Space: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
  Toast: {
    error: mocked.toastError,
  },
  Typography: {
    Text: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
    Paragraph: ({ children }: { children?: ReactNode }) => createElement('p', null, children),
  },
}));

vi.mock('@/components', () => ({
  PageCard: ({ title, children }: { title?: ReactNode; children?: ReactNode }) =>
    createElement('section', null, createElement('h1', null, title), children),
}));

vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/services/user', () => ({
  getAccountConfigs: mocked.getAccountConfigs,
  translateText: mocked.translateText,
}));

vi.mock('@/utils/error', () => ({
  getHttpErrorMessage: () => 'request failed',
}));

vi.mock('react-router', () => ({
  useNavigate: () => mocked.navigate,
}));

describe('ai translate page', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocked.getAccountConfigs.mockResolvedValue({
      data: {},
    });
    mocked.translateText.mockResolvedValue({
      data: {
        text: 'Hello',
      },
    });
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

  it('shows a config prompt when no ai account is available and navigates manually on click', async () => {
    const { default: AiTranslateApp } = await import('../index');

    await act(async () => {
      root.render(createElement(AiTranslateApp));
    });

    expect(container.textContent).toContain('aiTranslate.config.title');

    const button = container.querySelector('button');
    expect(button).not.toBeNull();

    await act(async () => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mocked.navigate).toHaveBeenCalledWith('/setting/config/account');
  });

  it('submits translation and renders the result when ai config exists', async () => {
    mocked.getAccountConfigs.mockResolvedValue({
      data: {
        ai: {
          provider: 'openai',
          baseUrl: 'https://api.openai.com/v1',
          apiKey: 'secret',
          model: 'gpt-4.1-mini',
        },
      },
    });

    const { default: AiTranslateApp } = await import('../index');

    await act(async () => {
      root.render(createElement(AiTranslateApp));
    });
    await act(async () => {});

    const textarea = container.querySelector('textarea');
    const selects = Array.from(container.querySelectorAll('select'));
    const submit = container.querySelector('button');

    expect(textarea).not.toBeNull();
    expect(selects).toHaveLength(2);
    expect(submit).not.toBeNull();

    await act(async () => {
      if (textarea) {
        const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
        setValue?.call(textarea, '你好');
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (selects[0]) {
        selects[0].value = 'zh-CN';
        selects[0].dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (selects[1]) {
        selects[1].value = 'en-US';
        selects[1].dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await act(async () => {
      submit?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mocked.translateText).toHaveBeenCalledWith({
      text: '你好',
      sourceLanguage: 'zh-CN',
      targetLanguage: 'en-US',
    });
    expect(container.textContent).toContain('Hello');
  });
});
