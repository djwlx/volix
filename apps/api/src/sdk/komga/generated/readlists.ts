import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const readlistsKomgaOperations = {
  createReadList: {
    method: 'POST',
    path: '/api/v1/readlists',
    tag: 'Readlists',
    requiresAuth: true,
    pathParams: [],
    contentType: 'application/json',
  },
  deleteReadListById: {
    method: 'DELETE',
    path: '/api/v1/readlists/{id}',
    tag: 'Readlists',
    requiresAuth: true,
    pathParams: ['id'],
  },
  downloadReadListAsZip: {
    method: 'GET',
    path: '/api/v1/readlists/{id}/file',
    tag: 'Readlists',
    requiresAuth: true,
    pathParams: ['id'],
  },
  getReadListById: {
    method: 'GET',
    path: '/api/v1/readlists/{id}',
    tag: 'Readlists',
    requiresAuth: true,
    pathParams: ['id'],
  },
  getReadLists: { method: 'GET', path: '/api/v1/readlists', tag: 'Readlists', requiresAuth: true, pathParams: [] },
  updateReadListById: {
    method: 'PATCH',
    path: '/api/v1/readlists/{id}',
    tag: 'Readlists',
    requiresAuth: true,
    pathParams: ['id'],
    contentType: 'application/json',
  },
} as const satisfies KomgaOperationDefinitionMap;
