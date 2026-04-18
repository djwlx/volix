import { describe, expect, test } from 'vitest';
import { buildScheduledTaskInternalTools } from '../../apps/api/src/modules/ai/service/ai-internal-tool-builtins/scheduled-task-tools';

describe('scheduled task ai tools', () => {
  test('registers scheduled task tools', () => {
    const names = buildScheduledTaskInternalTools().map(item => item.name);
    expect(names).toContain('scheduled_task.create');
    expect(names).toContain('scheduled_task.run_now');
  });

  test('create and run_now require approval', () => {
    const createTool = buildScheduledTaskInternalTools().find(item => item.name === 'scheduled_task.create');
    const runTool = buildScheduledTaskInternalTools().find(item => item.name === 'scheduled_task.run_now');
    expect(createTool?.requiresApproval).toBe(true);
    expect(runTool?.requiresApproval).toBe(true);
  });
});
