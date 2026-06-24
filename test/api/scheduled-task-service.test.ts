import { describe, expect, test } from 'vitest';
import { ScheduledTaskType } from '../../packages/types/src/api';
import {
  getTaskExecutor,
  getTaskTypeDefinition,
  isSupportedTaskType,
  listTaskTypeDefinitions,
  normalizeTaskParams,
} from '../../apps/api/src/modules/task-center/service/task-type-registry';

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
});
