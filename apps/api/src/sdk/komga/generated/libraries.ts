import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const librariesKomgaOperations = {
  addLibrary: {
    method: 'POST',
    path: '/api/v1/libraries',
    tag: 'Libraries',
    requiresAuth: true,
    pathParams: [],
    contentType: 'application/json',
  },
  deleteLibraryById: {
    method: 'DELETE',
    path: '/api/v1/libraries/{libraryId}',
    tag: 'Libraries',
    requiresAuth: true,
    pathParams: ['libraryId'],
  },
  getLibraries: { method: 'GET', path: '/api/v1/libraries', tag: 'Libraries', requiresAuth: true, pathParams: [] },
  getLibraryById: {
    method: 'GET',
    path: '/api/v1/libraries/{libraryId}',
    tag: 'Libraries',
    requiresAuth: true,
    pathParams: ['libraryId'],
  },
  libraryAnalyze: {
    method: 'POST',
    path: '/api/v1/libraries/{libraryId}/analyze',
    tag: 'Libraries',
    requiresAuth: true,
    pathParams: ['libraryId'],
  },
  libraryEmptyTrash: {
    method: 'POST',
    path: '/api/v1/libraries/{libraryId}/empty-trash',
    tag: 'Libraries',
    requiresAuth: true,
    pathParams: ['libraryId'],
  },
  libraryRefreshMetadata: {
    method: 'POST',
    path: '/api/v1/libraries/{libraryId}/metadata/refresh',
    tag: 'Libraries',
    requiresAuth: true,
    pathParams: ['libraryId'],
  },
  libraryScan: {
    method: 'POST',
    path: '/api/v1/libraries/{libraryId}/scan',
    tag: 'Libraries',
    requiresAuth: true,
    pathParams: ['libraryId'],
  },
  updateLibraryById: {
    method: 'PATCH',
    path: '/api/v1/libraries/{libraryId}',
    tag: 'Libraries',
    requiresAuth: true,
    pathParams: ['libraryId'],
    contentType: 'application/json',
  },
} as const satisfies KomgaOperationDefinitionMap;
