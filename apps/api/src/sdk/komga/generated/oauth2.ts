import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const oauth2KomgaOperations = {
  getOAuth2Providers: {
    method: 'GET',
    path: '/api/v1/oauth2/providers',
    tag: 'OAuth2',
    requiresAuth: false,
    pathParams: [],
  },
} as const satisfies KomgaOperationDefinitionMap;
