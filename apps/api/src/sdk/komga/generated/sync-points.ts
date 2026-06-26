import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const syncPointsKomgaOperations = {
  deleteSyncPointsForCurrentUser: {
    method: 'DELETE',
    path: '/api/v1/syncpoints/me',
    tag: 'Sync points',
    requiresAuth: true,
    pathParams: [],
  },
} as const satisfies KomgaOperationDefinitionMap;
