import { describe, expect, test } from 'vitest';
import { ScheduledTaskType } from '../../packages/types/src/api';
import {
  getTaskExecutor,
  getTaskTypeDefinition,
  isSupportedTaskType,
  listTaskTypeDefinitions,
  normalizeTaskParams,
} from '../../apps/api/src/modules/task-center/service/task-type-registry';
import {
  getNextRunAtFromCron,
  isValidCronExpression,
} from '../../apps/api/src/modules/task-center/service/scheduled-task.service';

describe('scheduled task service', () => {
  test('lists the built-in scheduled task definitions', () => {
    const definitions = listTaskTypeDefinitions();

    expect(definitions.map(item => item.type)).toEqual([ScheduledTaskType.ASTRBOT_RANDOM_PIC]);
    expect(definitions[0]?.labelKey).toBe('taskCenter.type.astrbotRandomPic');
  });

  test('normalizes params by task type', () => {
    expect(
      normalizeTaskParams(ScheduledTaskType.ASTRBOT_RANDOM_PIC, {
        umos: ['qq:group:1', '', 'qq:group:1', 'telegram:private:2'],
        ignored: true,
      })
    ).toEqual({
      umos: ['qq:group:1', 'telegram:private:2'],
    });
  });

  test('resolves task executor from the registry', () => {
    expect(getTaskExecutor(ScheduledTaskType.ASTRBOT_RANDOM_PIC)).toEqual(expect.any(Function));
    expect(getTaskTypeDefinition(ScheduledTaskType.ASTRBOT_RANDOM_PIC)?.requiresAstrbotConfig).toBe(true);
  });

  test('rejects unsupported task types', () => {
    expect(isSupportedTaskType(ScheduledTaskType.ASTRBOT_RANDOM_PIC)).toBe(true);
    expect(isSupportedTaskType('unknown_task')).toBe(false);
  });

  test('validates cron expressions with real parser rules', () => {
    expect(isValidCronExpression('0 9 * * *')).toBe(true);
    expect(isValidCronExpression('0 */10 * * * *')).toBe(true);
    expect(isValidCronExpression('99 99 * * *')).toBe(false);
    expect(isValidCronExpression('invalid cron')).toBe(false);
  });

  test('calculates the next run time for enabled cron tasks', () => {
    expect(Date.parse(String(getNextRunAtFromCron('0 9 * * *')))).not.toBeNaN();
    expect(getNextRunAtFromCron('99 99 * * *')).toBeNull();
  });
});
