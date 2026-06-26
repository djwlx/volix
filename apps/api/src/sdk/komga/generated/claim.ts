import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const claimKomgaOperations = {
  claimServer: { method: 'POST', path: '/api/v1/claim', tag: 'Claim', requiresAuth: false, pathParams: [] },
  getClaimStatus: { method: 'GET', path: '/api/v1/claim', tag: 'Claim', requiresAuth: false, pathParams: [] },
} as const satisfies KomgaOperationDefinitionMap;
