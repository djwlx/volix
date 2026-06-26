import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const collectionsKomgaOperations = {
  createCollection: {
    method: 'POST',
    path: '/api/v1/collections',
    tag: 'Collections',
    requiresAuth: true,
    pathParams: [],
    contentType: 'application/json',
  },
  deleteCollectionById: {
    method: 'DELETE',
    path: '/api/v1/collections/{id}',
    tag: 'Collections',
    requiresAuth: true,
    pathParams: ['id'],
  },
  getCollectionById: {
    method: 'GET',
    path: '/api/v1/collections/{id}',
    tag: 'Collections',
    requiresAuth: true,
    pathParams: ['id'],
  },
  getCollections: {
    method: 'GET',
    path: '/api/v1/collections',
    tag: 'Collections',
    requiresAuth: true,
    pathParams: [],
  },
  updateCollectionById: {
    method: 'PATCH',
    path: '/api/v1/collections/{id}',
    tag: 'Collections',
    requiresAuth: true,
    pathParams: ['id'],
    contentType: 'application/json',
  },
} as const satisfies KomgaOperationDefinitionMap;
