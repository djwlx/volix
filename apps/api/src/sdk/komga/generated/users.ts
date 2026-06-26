import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const usersKomgaOperations = {
  addUser: {
    method: 'POST',
    path: '/api/v2/users',
    tag: 'Users',
    requiresAuth: true,
    pathParams: [],
    contentType: 'application/json',
  },
  deleteUserById: {
    method: 'DELETE',
    path: '/api/v2/users/{id}',
    tag: 'Users',
    requiresAuth: true,
    pathParams: ['id'],
  },
  getAuthenticationActivity: {
    method: 'GET',
    path: '/api/v2/users/authentication-activity',
    tag: 'Users',
    requiresAuth: true,
    pathParams: [],
  },
  getLatestAuthenticationActivityByUserId: {
    method: 'GET',
    path: '/api/v2/users/{id}/authentication-activity/latest',
    tag: 'Users',
    requiresAuth: true,
    pathParams: ['id'],
  },
  getUsers: { method: 'GET', path: '/api/v2/users', tag: 'Users', requiresAuth: true, pathParams: [] },
  updatePasswordByUserId: {
    method: 'PATCH',
    path: '/api/v2/users/{id}/password',
    tag: 'Users',
    requiresAuth: true,
    pathParams: ['id'],
    contentType: 'application/json',
  },
  updateUserById: {
    method: 'PATCH',
    path: '/api/v2/users/{id}',
    tag: 'Users',
    requiresAuth: true,
    pathParams: ['id'],
    contentType: 'application/json',
  },
} as const satisfies KomgaOperationDefinitionMap;
