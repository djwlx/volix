import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const managementKomgaOperations = {
  getActuatorInfo: { method: 'GET', path: '/actuator/info', tag: 'Management', requiresAuth: true, pathParams: [] },
} as const satisfies KomgaOperationDefinitionMap;
