import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const apiKeysKomgaOperations = {
  createApiKeyForCurrentUser: {
    method: 'POST',
    path: '/api/v2/users/me/api-keys',
    tag: 'API Keys',
    requiresAuth: true,
    pathParams: [],
    contentType: 'application/json',
  },
  deleteApiKeyByKeyId: {
    method: 'DELETE',
    path: '/api/v2/users/me/api-keys/{keyId}',
    tag: 'API Keys',
    requiresAuth: true,
    pathParams: ['keyId'],
  },
  getApiKeysForCurrentUser: {
    method: 'GET',
    path: '/api/v2/users/me/api-keys',
    tag: 'API Keys',
    requiresAuth: true,
    pathParams: [],
  },
} as const satisfies KomgaOperationDefinitionMap;
