import type { KomgaOperationDefinitionMap } from '../core/komga.types';

export const announcementsKomgaOperations = {
  getAnnouncements: {
    method: 'GET',
    path: '/api/v1/announcements',
    tag: 'Announcements',
    requiresAuth: true,
    pathParams: [],
  },
  markAnnouncementsRead: {
    method: 'PUT',
    path: '/api/v1/announcements',
    tag: 'Announcements',
    requiresAuth: true,
    pathParams: [],
    contentType: 'application/json',
  },
} as const satisfies KomgaOperationDefinitionMap;
