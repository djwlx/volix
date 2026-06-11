// @vitest-environment jsdom

import { act, createElement } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@douyinfe/semi-ui', () => {
  const Modal = ({ visible, title, children }: { visible?: boolean; title?: ReactNode; children?: ReactNode }) =>
    visible ? createElement('section', null, createElement('h1', null, title), children) : null;
  const Progress = ({ percent }: { percent: number }) => createElement('div', null, `${percent}%`);
  const Space = ({ children }: { children?: ReactNode }) => createElement('div', null, children);
  const Text = ({ children }: { children?: ReactNode }) => createElement('span', null, children);
  return {
    Modal,
    Progress,
    Space,
    Typography: {
      Text,
    },
  };
});

vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: (key: string) =>
      ((
        {
          'formatConvert.upload.title': '本地文件上传中',
          'formatConvert.upload.subtitle': '文件上传完成后会自动创建转换任务。',
          'formatConvert.upload.leavePageHint': '上传过程中请不要离开页面，等待上传完成后会自动开始转换任务。',
          'formatConvert.upload.progressLabel': '上传进度',
        } as Record<string, string>
      )[key] || key),
  }),
}));

describe('upload progress modal', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
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

  it('renders upload progress details in a dedicated modal', async () => {
    const { UploadProgressModal } = await import('./upload-progress-modal');

    await act(async () => {
      root.render(
        createElement(UploadProgressModal, {
          visible: true,
          percent: 42,
          fileName: 'demo.mov',
        })
      );
    });

    expect(document.body.textContent).toContain('本地文件上传中');
    expect(document.body.textContent).toContain('文件上传完成后会自动创建转换任务。');
    expect(document.body.textContent).toContain('上传过程中请不要离开页面，等待上传完成后会自动开始转换任务。');
    expect(document.body.textContent).toContain('42%');
    expect(document.body.textContent).toContain('demo.mov');
  });
});
