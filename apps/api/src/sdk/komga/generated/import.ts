import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const importKomgaOperations = {
  analyzeTransientBook: {
    method: 'POST',
    path: '/api/v1/transient-books/{id}/analyze',
    tag: 'Import',
    requiresAuth: true,
    pathParams: ['id'],
  },
  getPageByTransientBookId: {
    method: 'GET',
    path: '/api/v1/transient-books/{id}/pages/{pageNumber}',
    tag: 'Import',
    requiresAuth: true,
    pathParams: ['id', 'pageNumber'],
  },
  importBooks: {
    method: 'POST',
    path: '/api/v1/books/import',
    tag: 'Import',
    requiresAuth: true,
    pathParams: [],
    contentType: 'application/json',
  },
  scanTransientBooks: {
    method: 'POST',
    path: '/api/v1/transient-books',
    tag: 'Import',
    requiresAuth: true,
    pathParams: [],
    contentType: 'application/json',
  },
} as const satisfies KomgaOperationDefinitionMap;
