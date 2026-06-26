import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const comicrackKomgaOperations = {
  matchComicRackList: {
    method: 'POST',
    path: '/api/v1/readlists/match/comicrack',
    tag: 'ComicRack',
    requiresAuth: true,
    pathParams: [],
    contentType: 'multipart/form-data',
  },
} as const satisfies KomgaOperationDefinitionMap;
