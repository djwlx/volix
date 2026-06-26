import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const collectionSeriesKomgaOperations = {
  getSeriesByCollectionId: {
    method: 'GET',
    path: '/api/v1/collections/{id}/series',
    tag: 'Collection Series',
    requiresAuth: true,
    pathParams: ['id'],
  },
} as const satisfies KomgaOperationDefinitionMap;
