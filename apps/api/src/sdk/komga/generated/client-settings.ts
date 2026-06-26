import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const clientSettingsKomgaOperations = {
  deleteGlobalSettings: {
    method: 'DELETE',
    path: '/api/v1/client-settings/global',
    tag: 'Client settings',
    requiresAuth: true,
    pathParams: [],
    contentType: 'application/json',
  },
  deleteUserSettings: {
    method: 'DELETE',
    path: '/api/v1/client-settings/user',
    tag: 'Client settings',
    requiresAuth: true,
    pathParams: [],
    contentType: 'application/json',
  },
  getGlobalSettings: {
    method: 'GET',
    path: '/api/v1/client-settings/global/list',
    tag: 'Client settings',
    requiresAuth: false,
    pathParams: [],
  },
  getUserSettings: {
    method: 'GET',
    path: '/api/v1/client-settings/user/list',
    tag: 'Client settings',
    requiresAuth: true,
    pathParams: [],
  },
  saveGlobalSetting: {
    method: 'PATCH',
    path: '/api/v1/client-settings/global',
    tag: 'Client settings',
    requiresAuth: true,
    pathParams: [],
    contentType: 'application/json',
  },
  saveUserSetting: {
    method: 'PATCH',
    path: '/api/v1/client-settings/user',
    tag: 'Client settings',
    requiresAuth: true,
    pathParams: [],
    contentType: 'application/json',
  },
} as const satisfies KomgaOperationDefinitionMap;
