import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const fileSystemKomgaOperations = {
  getDirectoryListing: {
    method: 'POST',
    path: '/api/v1/filesystem',
    tag: 'File system',
    requiresAuth: true,
    pathParams: [],
    contentType: 'application/json',
  },
} as const satisfies KomgaOperationDefinitionMap;
