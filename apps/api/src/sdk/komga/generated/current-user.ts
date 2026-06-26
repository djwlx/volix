import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const currentUserKomgaOperations = {
  getAuthenticationActivityForCurrentUser: {
    method: 'GET',
    path: '/api/v2/users/me/authentication-activity',
    tag: 'Current user',
    requiresAuth: true,
    pathParams: [],
  },
  getCurrentUser: { method: 'GET', path: '/api/v2/users/me', tag: 'Current user', requiresAuth: true, pathParams: [] },
  updatePasswordForCurrentUser: {
    method: 'PATCH',
    path: '/api/v2/users/me/password',
    tag: 'Current user',
    requiresAuth: true,
    pathParams: [],
    contentType: 'application/json',
  },
} as const satisfies KomgaOperationDefinitionMap;
