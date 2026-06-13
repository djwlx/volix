import { describe, expect, it } from 'vitest';
import { upsertFormatConvertTask, removeFormatConvertTaskById } from '../format-convert-task-events';

describe('format convert realtime task events', () => {
  it('prepends newly created tasks and replaces updated tasks by id', () => {
    const first = upsertFormatConvertTask([], { id: 2, status: 'pending' } as never);
    const second = upsertFormatConvertTask(first, { id: 2, status: 'completed' } as never);
    const third = upsertFormatConvertTask(second, { id: 3, status: 'pending' } as never);

    expect(first[0]?.id).toBe(2);
    expect(second[0]?.status).toBe('completed');
    expect(third.map(task => task.id)).toEqual([3, 2]);
  });

  it('removes deleted tasks by id', () => {
    expect(removeFormatConvertTaskById([{ id: 9 } as never], 9)).toEqual([]);
  });
});
