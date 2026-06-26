import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const readlistBooksKomgaOperations = {
  getBooksByReadListId: {
    method: 'GET',
    path: '/api/v1/readlists/{id}/books',
    tag: 'Readlist Books',
    requiresAuth: true,
    pathParams: ['id'],
  },
  getBookSiblingNextInReadList: {
    method: 'GET',
    path: '/api/v1/readlists/{id}/books/{bookId}/next',
    tag: 'Readlist Books',
    requiresAuth: true,
    pathParams: ['id', 'bookId'],
  },
  getBookSiblingPreviousInReadList: {
    method: 'GET',
    path: '/api/v1/readlists/{id}/books/{bookId}/previous',
    tag: 'Readlist Books',
    requiresAuth: true,
    pathParams: ['id', 'bookId'],
  },
} as const satisfies KomgaOperationDefinitionMap;
