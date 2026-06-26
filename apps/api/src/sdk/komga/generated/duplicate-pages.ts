import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const duplicatePagesKomgaOperations = {
  createOrUpdateKnownPageHash: {
    method: 'PUT',
    path: '/api/v1/page-hashes',
    tag: 'Duplicate Pages',
    requiresAuth: true,
    pathParams: [],
    contentType: 'application/json',
  },
  deleteDuplicatePagesByPageHash: {
    method: 'POST',
    path: '/api/v1/page-hashes/{pageHash}/delete-all',
    tag: 'Duplicate Pages',
    requiresAuth: true,
    pathParams: ['pageHash'],
  },
  deleteSingleMatchByPageHash: {
    method: 'POST',
    path: '/api/v1/page-hashes/{pageHash}/delete-match',
    tag: 'Duplicate Pages',
    requiresAuth: true,
    pathParams: ['pageHash'],
    contentType: 'application/json',
  },
  getKnownPageHashes: {
    method: 'GET',
    path: '/api/v1/page-hashes',
    tag: 'Duplicate Pages',
    requiresAuth: true,
    pathParams: [],
  },
  getKnownPageHashThumbnail: {
    method: 'GET',
    path: '/api/v1/page-hashes/{pageHash}/thumbnail',
    tag: 'Duplicate Pages',
    requiresAuth: true,
    pathParams: ['pageHash'],
  },
  getPageHashMatches: {
    method: 'GET',
    path: '/api/v1/page-hashes/{pageHash}',
    tag: 'Duplicate Pages',
    requiresAuth: true,
    pathParams: ['pageHash'],
  },
  getUnknownPageHashes: {
    method: 'GET',
    path: '/api/v1/page-hashes/unknown',
    tag: 'Duplicate Pages',
    requiresAuth: true,
    pathParams: [],
  },
  getUnknownPageHashThumbnail: {
    method: 'GET',
    path: '/api/v1/page-hashes/unknown/{pageHash}/thumbnail',
    tag: 'Duplicate Pages',
    requiresAuth: true,
    pathParams: ['pageHash'],
  },
} as const satisfies KomgaOperationDefinitionMap;
