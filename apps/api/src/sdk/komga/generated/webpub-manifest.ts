import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const webpubManifestKomgaOperations = {
  getBookEpubResource: {
    method: 'GET',
    path: '/api/v1/books/{bookId}/resource/{resource}',
    tag: 'WebPub Manifest',
    requiresAuth: false,
    pathParams: ['bookId', 'resource'],
  },
  getBookPositions: {
    method: 'GET',
    path: '/api/v1/books/{bookId}/positions',
    tag: 'WebPub Manifest',
    requiresAuth: true,
    pathParams: ['bookId'],
  },
  getBookProgression: {
    method: 'GET',
    path: '/api/v1/books/{bookId}/progression',
    tag: 'WebPub Manifest',
    requiresAuth: true,
    pathParams: ['bookId'],
  },
  getBookWebPubManifest: {
    method: 'GET',
    path: '/api/v1/books/{bookId}/manifest',
    tag: 'WebPub Manifest',
    requiresAuth: true,
    pathParams: ['bookId'],
  },
  getBookWebPubManifestDivina: {
    method: 'GET',
    path: '/api/v1/books/{bookId}/manifest/divina',
    tag: 'WebPub Manifest',
    requiresAuth: true,
    pathParams: ['bookId'],
  },
  getBookWebPubManifestEpub: {
    method: 'GET',
    path: '/api/v1/books/{bookId}/manifest/epub',
    tag: 'WebPub Manifest',
    requiresAuth: true,
    pathParams: ['bookId'],
  },
  getBookWebPubManifestPdf: {
    method: 'GET',
    path: '/api/v1/books/{bookId}/manifest/pdf',
    tag: 'WebPub Manifest',
    requiresAuth: true,
    pathParams: ['bookId'],
  },
  updateBookProgression: {
    method: 'PUT',
    path: '/api/v1/books/{bookId}/progression',
    tag: 'WebPub Manifest',
    requiresAuth: true,
    pathParams: ['bookId'],
    contentType: 'application/json',
  },
} as const satisfies KomgaOperationDefinitionMap;
