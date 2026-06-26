import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const historyKomgaOperations = {
  getHistoricalEvents: { method: 'GET', path: '/api/v1/history', tag: 'History', requiresAuth: true, pathParams: [] },
} as const satisfies KomgaOperationDefinitionMap;
