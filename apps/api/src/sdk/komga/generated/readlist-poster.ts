import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const readlistPosterKomgaOperations = {
  addUserUploadedReadListThumbnail: {
    method: 'POST',
    path: '/api/v1/readlists/{id}/thumbnails',
    tag: 'Readlist Poster',
    requiresAuth: true,
    pathParams: ['id'],
    contentType: 'multipart/form-data',
  },
  deleteUserUploadedReadListThumbnail: {
    method: 'DELETE',
    path: '/api/v1/readlists/{id}/thumbnails/{thumbnailId}',
    tag: 'Readlist Poster',
    requiresAuth: true,
    pathParams: ['id', 'thumbnailId'],
  },
  getReadListThumbnail: {
    method: 'GET',
    path: '/api/v1/readlists/{id}/thumbnail',
    tag: 'Readlist Poster',
    requiresAuth: true,
    pathParams: ['id'],
  },
  getReadListThumbnailById: {
    method: 'GET',
    path: '/api/v1/readlists/{id}/thumbnails/{thumbnailId}',
    tag: 'Readlist Poster',
    requiresAuth: true,
    pathParams: ['id', 'thumbnailId'],
  },
  getReadListThumbnails: {
    method: 'GET',
    path: '/api/v1/readlists/{id}/thumbnails',
    tag: 'Readlist Poster',
    requiresAuth: true,
    pathParams: ['id'],
  },
  markReadListThumbnailSelected: {
    method: 'PUT',
    path: '/api/v1/readlists/{id}/thumbnails/{thumbnailId}/selected',
    tag: 'Readlist Poster',
    requiresAuth: true,
    pathParams: ['id', 'thumbnailId'],
  },
} as const satisfies KomgaOperationDefinitionMap;
