import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const bookPagesKomgaOperations = {
  getBookPageByNumber: {
    method: 'GET',
    path: '/api/v1/books/{bookId}/pages/{pageNumber}',
    tag: 'Book Pages',
    requiresAuth: true,
    pathParams: ['bookId', 'pageNumber'],
  },
  getBookPageRawByNumber: {
    method: 'GET',
    path: '/api/v1/books/{bookId}/pages/{pageNumber}/raw',
    tag: 'Book Pages',
    requiresAuth: true,
    pathParams: ['bookId', 'pageNumber'],
  },
  getBookPages: {
    method: 'GET',
    path: '/api/v1/books/{bookId}/pages',
    tag: 'Book Pages',
    requiresAuth: true,
    pathParams: ['bookId'],
  },
  getBookPageThumbnailByNumber: {
    method: 'GET',
    path: '/api/v1/books/{bookId}/pages/{pageNumber}/thumbnail',
    tag: 'Book Pages',
    requiresAuth: true,
    pathParams: ['bookId', 'pageNumber'],
  },
} as const satisfies KomgaOperationDefinitionMap;
