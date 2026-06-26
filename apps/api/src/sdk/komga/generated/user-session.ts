import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const userSessionKomgaOperations = {
  convertHeaderSessionToCookie: {
    method: 'GET',
    path: '/api/v1/login/set-cookie',
    tag: 'User session',
    requiresAuth: true,
    pathParams: [],
  },
  postLogout: { method: 'GET', path: '/api/logout', tag: 'User session', requiresAuth: true, pathParams: [] },
  postLogout_1: { method: 'POST', path: '/api/logout', tag: 'User session', requiresAuth: true, pathParams: [] },
} as const satisfies KomgaOperationDefinitionMap;
