import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const collectionPosterKomgaOperations = {
  addUserUploadedCollectionThumbnail: {
    method: 'POST',
    path: '/api/v1/collections/{id}/thumbnails',
    tag: 'Collection Poster',
    requiresAuth: true,
    pathParams: ['id'],
    contentType: 'multipart/form-data',
  },
  deleteUserUploadedCollectionThumbnail: {
    method: 'DELETE',
    path: '/api/v1/collections/{id}/thumbnails/{thumbnailId}',
    tag: 'Collection Poster',
    requiresAuth: true,
    pathParams: ['id', 'thumbnailId'],
  },
  getCollectionThumbnail: {
    method: 'GET',
    path: '/api/v1/collections/{id}/thumbnail',
    tag: 'Collection Poster',
    requiresAuth: true,
    pathParams: ['id'],
  },
  getCollectionThumbnailById: {
    method: 'GET',
    path: '/api/v1/collections/{id}/thumbnails/{thumbnailId}',
    tag: 'Collection Poster',
    requiresAuth: true,
    pathParams: ['id', 'thumbnailId'],
  },
  getCollectionThumbnails: {
    method: 'GET',
    path: '/api/v1/collections/{id}/thumbnails',
    tag: 'Collection Poster',
    requiresAuth: true,
    pathParams: ['id'],
  },
  markCollectionThumbnailSelected: {
    method: 'PUT',
    path: '/api/v1/collections/{id}/thumbnails/{thumbnailId}/selected',
    tag: 'Collection Poster',
    requiresAuth: true,
    pathParams: ['id', 'thumbnailId'],
  },
} as const satisfies KomgaOperationDefinitionMap;
