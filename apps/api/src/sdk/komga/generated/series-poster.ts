import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const seriesPosterKomgaOperations = {
  addUserUploadedSeriesThumbnail: {
    method: 'POST',
    path: '/api/v1/series/{seriesId}/thumbnails',
    tag: 'Series Poster',
    requiresAuth: true,
    pathParams: ['seriesId'],
    contentType: 'multipart/form-data',
  },
  deleteUserUploadedSeriesThumbnail: {
    method: 'DELETE',
    path: '/api/v1/series/{seriesId}/thumbnails/{thumbnailId}',
    tag: 'Series Poster',
    requiresAuth: true,
    pathParams: ['seriesId', 'thumbnailId'],
  },
  getSeriesThumbnail: {
    method: 'GET',
    path: '/api/v1/series/{seriesId}/thumbnail',
    tag: 'Series Poster',
    requiresAuth: true,
    pathParams: ['seriesId'],
  },
  getSeriesThumbnailById: {
    method: 'GET',
    path: '/api/v1/series/{seriesId}/thumbnails/{thumbnailId}',
    tag: 'Series Poster',
    requiresAuth: true,
    pathParams: ['seriesId', 'thumbnailId'],
  },
  getSeriesThumbnails: {
    method: 'GET',
    path: '/api/v1/series/{seriesId}/thumbnails',
    tag: 'Series Poster',
    requiresAuth: true,
    pathParams: ['seriesId'],
  },
  markSeriesThumbnailSelected: {
    method: 'PUT',
    path: '/api/v1/series/{seriesId}/thumbnails/{thumbnailId}/selected',
    tag: 'Series Poster',
    requiresAuth: true,
    pathParams: ['seriesId', 'thumbnailId'],
  },
} as const satisfies KomgaOperationDefinitionMap;
