import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const deprecatedKomgaOperations = {
  getAuthorsDeprecated: {
    method: 'GET',
    path: '/api/v1/authors',
    tag: 'Deprecated',
    requiresAuth: true,
    pathParams: [],
  },
  updateLibraryByIdDeprecated: {
    method: 'PUT',
    path: '/api/v1/libraries/{libraryId}',
    tag: 'Deprecated',
    requiresAuth: true,
    pathParams: ['libraryId'],
    contentType: 'application/json',
  },
} as const satisfies KomgaOperationDefinitionMap;
