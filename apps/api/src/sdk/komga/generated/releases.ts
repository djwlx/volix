import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const releasesKomgaOperations = {
  getReleases: { method: 'GET', path: '/api/v1/releases', tag: 'Releases', requiresAuth: true, pathParams: [] },
} as const satisfies KomgaOperationDefinitionMap;
