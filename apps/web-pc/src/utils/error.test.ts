import { describe, expect, it } from 'vitest';
import { getDisplayErrorMessage } from './error';

describe('error utils', () => {
  it('prefers backend business message over axios status message', () => {
    const error = Object.assign(new Error('Request failed with status code 400'), {
      response: {
        data: {
          message: '源文件没有音频流，无法转换为音频文件',
        },
      },
    });

    expect(getDisplayErrorMessage(error, '创建任务失败')).toBe('源文件没有音频流，无法转换为音频文件');
  });

  it('falls back to error message when backend message is missing', () => {
    expect(getDisplayErrorMessage(new Error('network down'), '创建任务失败')).toBe('network down');
  });
});
