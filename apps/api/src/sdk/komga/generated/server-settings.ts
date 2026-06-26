import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const serverSettingsKomgaOperations = {
  getServerSettings: {
    method: 'GET',
    path: '/api/v1/settings',
    tag: 'Server settings',
    requiresAuth: true,
    pathParams: [],
  },
  updateServerSettings: {
    method: 'PATCH',
    path: '/api/v1/settings',
    tag: 'Server settings',
    requiresAuth: true,
    pathParams: [],
    contentType: 'application/json',
  },
} as const satisfies KomgaOperationDefinitionMap;
