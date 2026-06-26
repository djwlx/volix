import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const fontsKomgaOperations = {
  getFontFamilyAsCss: {
    method: 'GET',
    path: '/api/v1/fonts/resource/{fontFamily}/css',
    tag: 'Fonts',
    requiresAuth: false,
    pathParams: ['fontFamily'],
  },
  getFontFile: {
    method: 'GET',
    path: '/api/v1/fonts/resource/{fontFamily}/{fontFile}',
    tag: 'Fonts',
    requiresAuth: false,
    pathParams: ['fontFamily', 'fontFile'],
  },
  getFonts: { method: 'GET', path: '/api/v1/fonts/families', tag: 'Fonts', requiresAuth: true, pathParams: [] },
} as const satisfies KomgaOperationDefinitionMap;
