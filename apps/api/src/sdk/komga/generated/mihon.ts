import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const mihonKomgaOperations = {
  getMihonReadProgressByReadListId: {
    method: 'GET',
    path: '/api/v1/readlists/{id}/read-progress/tachiyomi',
    tag: 'Mihon',
    requiresAuth: true,
    pathParams: ['id'],
  },
  getMihonReadProgressBySeriesId: {
    method: 'GET',
    path: '/api/v2/series/{seriesId}/read-progress/tachiyomi',
    tag: 'Mihon',
    requiresAuth: true,
    pathParams: ['seriesId'],
  },
  updateMihonReadProgressByReadListId: {
    method: 'PUT',
    path: '/api/v1/readlists/{id}/read-progress/tachiyomi',
    tag: 'Mihon',
    requiresAuth: true,
    pathParams: ['id'],
    contentType: 'application/json',
  },
  updateMihonReadProgressBySeriesId: {
    method: 'PUT',
    path: '/api/v2/series/{seriesId}/read-progress/tachiyomi',
    tag: 'Mihon',
    requiresAuth: true,
    pathParams: ['seriesId'],
    contentType: 'application/json',
  },
} as const satisfies KomgaOperationDefinitionMap;
