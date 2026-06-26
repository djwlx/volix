import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const tasksKomgaOperations = {
  emptyTaskQueue: { method: 'DELETE', path: '/api/v1/tasks', tag: 'Tasks', requiresAuth: true, pathParams: [] },
} as const satisfies KomgaOperationDefinitionMap;
