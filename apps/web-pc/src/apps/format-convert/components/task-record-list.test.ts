// @vitest-environment jsdom

import { act, createElement } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  FormatConvertCommandMode,
  FormatConvertMode,
  FormatConvertSourceType,
  FormatConvertTargetType,
  FormatConvertTaskStatus,
  type FormatConvertTaskItem,
} from '@volix/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@douyinfe/semi-ui', () => {
  let lastTableProps: Record<string, unknown> | undefined;
  const Button = ({ children, onClick }: { children?: ReactNode; onClick?: () => void }) =>
    createElement('button', { onClick }, children);
  const Card = ({ title, children }: { title?: ReactNode; children?: ReactNode }) =>
    createElement('section', null, createElement('h2', null, title), children);
  const Empty = ({ title, description }: { title?: ReactNode; description?: ReactNode }) =>
    createElement('div', null, title, description);
  const Space = ({ children }: { children?: ReactNode }) => createElement('div', null, children);
  const Text = ({ children }: { children?: ReactNode }) => createElement('span', null, children);
  const Table = ({
    dataSource,
    columns,
    expandedRowKeys,
    expandedRowRender,
    ...rest
  }: {
    dataSource: Array<Record<string, unknown>>;
    columns: Array<{ render?: (_text: unknown, record: Record<string, unknown>) => ReactNode }>;
    expandedRowKeys?: Array<string | number>;
    expandedRowRender?: (record: Record<string, unknown>) => ReactNode;
  }) => (
    (lastTableProps = { dataSource, columns, expandedRowKeys, expandedRowRender, ...rest }),
    createElement(
      'div',
      null,
      dataSource.map(record =>
        createElement(
          'article',
          { key: String(record.id) },
          columns.map((column, index) =>
            createElement('div', { key: `${record.id}-${index}` }, column.render?.(undefined, record))
          ),
          expandedRowKeys?.includes(record.id as number) ? expandedRowRender?.(record) : null
        )
      )
    )
  );

  return {
    Button,
    Card,
    Empty,
    Space,
    Table,
    Toast: {
      error: vi.fn(),
    },
    Typography: {
      Text,
    },
    __getLastTableProps: () => lastTableProps,
  };
});

vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: (key: string) =>
      ((
        {
          'common.error.requestFailed': '请求失败',
          'common.status.none': '无',
          'common.toggle.on': '开启',
          'common.toggle.off': '关闭',
          'formatConvert.record.title': '转换记录',
          'formatConvert.record.emptyTitle': '暂无',
          'formatConvert.record.emptyDescription': '暂无描述',
          'formatConvert.record.source': '源文件',
          'formatConvert.record.target': '目标',
          'formatConvert.record.status': '状态',
          'formatConvert.record.updatedAt': '更新时间',
          'formatConvert.record.action': '操作',
          'formatConvert.record.detail': '查看详情',
          'formatConvert.record.hideDetail': '收起详情',
          'formatConvert.record.download': '下载结果',
          'formatConvert.record.retry': '重新执行',
          'formatConvert.record.cleanup': '清理本地文件',
          'formatConvert.record.detail.sourceMediaInfo': '原始信息',
          'formatConvert.record.detail.convertSummary': '转换参数',
          'formatConvert.record.detail.resultMediaInfo': '转换后信息',
          'formatConvert.record.detail.formatName': '格式',
          'formatConvert.record.detail.duration': '时长',
          'formatConvert.record.detail.size': '大小',
          'formatConvert.record.detail.bitRate': '整体码率',
          'formatConvert.record.detail.videoCodec': '视频编码',
          'formatConvert.record.detail.resolution': '分辨率',
          'formatConvert.record.detail.frameRate': '帧率',
          'formatConvert.record.detail.audioCodec': '音频编码',
          'formatConvert.record.detail.sampleRate': '采样率',
          'formatConvert.record.detail.channels': '声道数',
          'formatConvert.record.detail.channelLayout': '声道布局',
          'formatConvert.record.detail.audioBitRate': '音频码率',
          'formatConvert.record.detail.videoBitRate': '视频码率',
          'formatConvert.record.detail.commandMode': '命令模式',
          'formatConvert.record.detail.commandMode.preset': '预设',
          'formatConvert.record.detail.commandMode.custom': '自定义',
          'formatConvert.record.detail.preset': '预设方案',
          'formatConvert.record.detail.crf': 'CRF',
          'formatConvert.record.detail.encodingPreset': '编码预设',
          'formatConvert.record.detail.keepAudio': '保留音频',
          'formatConvert.record.detail.customArgs': '自定义参数',
          'formatConvert.form.outputFormat': '输出格式',
          'formatConvert.form.videoCodec': '视频编码',
          'formatConvert.form.audioCodec': '音频编码',
          'formatConvert.form.resolution': '分辨率',
          'formatConvert.preset.audioFlacLossless': '无损音频 FLAC',
        } as Record<string, string>
      )[key] || key),
  }),
}));

vi.mock('@/services/format-convert', () => ({
  downloadFormatConvertResult: vi.fn(),
}));

vi.mock('../task-status', () => ({
  renderFormatConvertTaskStatus: () => 'completed',
}));

describe('task record list', () => {
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

  it('shows source summary, convert summary, and result summary in expanded rows', async () => {
    const { TaskRecordList } = await import('./task-record-list');
    const semi = await import('@douyinfe/semi-ui');

    await act(async () => {
      root.render(
        createElement(TaskRecordList, {
          loading: false,
          tasks: [
            {
              id: 1,
              userId: 'u1',
              mode: FormatConvertMode.LOCAL,
              commandMode: FormatConvertCommandMode.PRESET,
              status: FormatConvertTaskStatus.COMPLETED,
              source: { type: FormatConvertSourceType.UPLOAD, fileName: 'demo.mov', uploadPath: '/tmp/demo.mov' },
              target: { type: FormatConvertTargetType.DOWNLOAD, fileName: 'demo.flac' },
              option: { outputFormat: 'flac' },
              presetId: 'audio-flac-lossless',
              convertSummary: {
                commandMode: FormatConvertCommandMode.PRESET,
                presetId: 'audio-flac-lossless',
                outputFormat: 'flac',
                audioCodec: 'flac',
                keepAudio: true,
              },
              sourceMediaInfo: {
                formatName: 'mov,mp4,m4a,3gp,3g2,mj2',
                durationSeconds: 8,
                sizeBytes: 1024,
                bitRateKbps: 512,
                hasVideo: true,
                hasAudio: true,
                video: {
                  codecName: 'h264',
                  width: 1920,
                  height: 1080,
                  frameRate: 30,
                  bitRateKbps: 3200,
                },
                audio: {
                  codecName: 'aac',
                  sampleRateHz: 48000,
                  channels: 2,
                  channelLayout: 'stereo',
                  bitRateKbps: 192,
                },
              },
              resultMediaInfo: {
                formatName: 'flac',
                durationSeconds: 8,
                sizeBytes: 2048,
                bitRateKbps: 1024,
                hasVideo: false,
                hasAudio: true,
                audio: {
                  codecName: 'flac',
                  sampleRateHz: 48000,
                  channels: 2,
                  channelLayout: 'stereo',
                  bitRateKbps: 1024,
                },
              },
              attemptCount: 0,
              updatedAt: '2026-06-11T00:00:00.000Z',
              resultLocalPath: '/tmp/result/demo.flac',
            } satisfies FormatConvertTaskItem,
          ] as FormatConvertTaskItem[],
          onCleanup: vi.fn(),
          onRetry: vi.fn(),
        })
      );
    });

    expect(
      (semi as unknown as { __getLastTableProps: () => Record<string, unknown> }).__getLastTableProps()?.expandIcon
    ).toBe(false);
    expect(document.body.textContent).toContain('查看详情');

    await act(async () => {
      const detailButton = Array.from(document.querySelectorAll('button')).find(
        item => item.textContent === '查看详情'
      );
      detailButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(document.body.textContent).toContain('原始信息');
    expect(document.body.textContent).toContain('转换参数');
    expect(document.body.textContent).toContain('转换后信息');
    expect(document.body.textContent).toContain('mov,mp4,m4a,3gp,3g2,mj2');
    expect(document.body.textContent).toContain('无损音频 FLAC');
    expect(document.body.textContent).toContain('flac');
  });
});
