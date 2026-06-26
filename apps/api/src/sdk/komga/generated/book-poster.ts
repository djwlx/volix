import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const bookPosterKomgaOperations = {
  addUserUploadedBookThumbnail: {
    method: 'POST',
    path: '/api/v1/books/{bookId}/thumbnails',
    tag: 'Book Poster',
    requiresAuth: true,
    pathParams: ['bookId'],
    contentType: 'multipart/form-data',
  },
  booksRegenerateThumbnails: {
    method: 'PUT',
    path: '/api/v1/books/thumbnails',
    tag: 'Book Poster',
    requiresAuth: true,
    pathParams: [],
  },
  deleteUserUploadedBookThumbnail: {
    method: 'DELETE',
    path: '/api/v1/books/{bookId}/thumbnails/{thumbnailId}',
    tag: 'Book Poster',
    requiresAuth: true,
    pathParams: ['bookId', 'thumbnailId'],
  },
  getBookThumbnail: {
    method: 'GET',
    path: '/api/v1/books/{bookId}/thumbnail',
    tag: 'Book Poster',
    requiresAuth: true,
    pathParams: ['bookId'],
  },
  getBookThumbnailById: {
    method: 'GET',
    path: '/api/v1/books/{bookId}/thumbnails/{thumbnailId}',
    tag: 'Book Poster',
    requiresAuth: true,
    pathParams: ['bookId', 'thumbnailId'],
  },
  getBookThumbnails: {
    method: 'GET',
    path: '/api/v1/books/{bookId}/thumbnails',
    tag: 'Book Poster',
    requiresAuth: true,
    pathParams: ['bookId'],
  },
  markBookThumbnailSelected: {
    method: 'PUT',
    path: '/api/v1/books/{bookId}/thumbnails/{thumbnailId}/selected',
    tag: 'Book Poster',
    requiresAuth: true,
    pathParams: ['bookId', 'thumbnailId'],
  },
} as const satisfies KomgaOperationDefinitionMap;
