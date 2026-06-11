import { describe, expect, it } from 'vitest';
import { FormatConvertTaskStatus } from '@volix/types';
import { getTaskStatusView } from './task-status';

describe('format convert task status', () => {
  it('maps upload_failed to the translated danger tag contract', () => {
    expect(getTaskStatusView(FormatConvertTaskStatus.UPLOAD_FAILED).tone).toBe('red');
  });
});
