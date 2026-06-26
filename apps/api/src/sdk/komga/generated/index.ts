import { announcementsKomgaOperations } from './announcements';
import { apiKeysKomgaOperations } from './api-keys';
import { bookPagesKomgaOperations } from './book-pages';
import { bookPosterKomgaOperations } from './book-poster';
import { booksKomgaOperations } from './books';
import { claimKomgaOperations } from './claim';
import { clientSettingsKomgaOperations } from './client-settings';
import { collectionPosterKomgaOperations } from './collection-poster';
import { collectionSeriesKomgaOperations } from './collection-series';
import { collectionsKomgaOperations } from './collections';
import { comicrackKomgaOperations } from './comicrack';
import { currentUserKomgaOperations } from './current-user';
import { deprecatedKomgaOperations } from './deprecated';
import { duplicatePagesKomgaOperations } from './duplicate-pages';
import { fileSystemKomgaOperations } from './file-system';
import { fontsKomgaOperations } from './fonts';
import { historyKomgaOperations } from './history';
import { importKomgaOperations } from './import';
import { librariesKomgaOperations } from './libraries';
import { managementKomgaOperations } from './management';
import { mihonKomgaOperations } from './mihon';
import { oauth2KomgaOperations } from './oauth2';
import { readlistBooksKomgaOperations } from './readlist-books';
import { readlistPosterKomgaOperations } from './readlist-poster';
import { readlistsKomgaOperations } from './readlists';
import { referentialMetadataKomgaOperations } from './referential-metadata';
import { releasesKomgaOperations } from './releases';
import { seriesKomgaOperations } from './series';
import { seriesPosterKomgaOperations } from './series-poster';
import { serverSettingsKomgaOperations } from './server-settings';
import { syncPointsKomgaOperations } from './sync-points';
import { tasksKomgaOperations } from './tasks';
import { userSessionKomgaOperations } from './user-session';
import { usersKomgaOperations } from './users';
import { webpubManifestKomgaOperations } from './webpub-manifest';

export const komgaOperationDefinitions = {
  ...announcementsKomgaOperations,
  ...apiKeysKomgaOperations,
  ...bookPagesKomgaOperations,
  ...bookPosterKomgaOperations,
  ...booksKomgaOperations,
  ...claimKomgaOperations,
  ...clientSettingsKomgaOperations,
  ...collectionPosterKomgaOperations,
  ...collectionSeriesKomgaOperations,
  ...collectionsKomgaOperations,
  ...comicrackKomgaOperations,
  ...currentUserKomgaOperations,
  ...deprecatedKomgaOperations,
  ...duplicatePagesKomgaOperations,
  ...fileSystemKomgaOperations,
  ...fontsKomgaOperations,
  ...historyKomgaOperations,
  ...importKomgaOperations,
  ...librariesKomgaOperations,
  ...managementKomgaOperations,
  ...mihonKomgaOperations,
  ...oauth2KomgaOperations,
  ...readlistBooksKomgaOperations,
  ...readlistPosterKomgaOperations,
  ...readlistsKomgaOperations,
  ...referentialMetadataKomgaOperations,
  ...releasesKomgaOperations,
  ...seriesKomgaOperations,
  ...seriesPosterKomgaOperations,
  ...serverSettingsKomgaOperations,
  ...syncPointsKomgaOperations,
  ...tasksKomgaOperations,
  ...userSessionKomgaOperations,
  ...usersKomgaOperations,
  ...webpubManifestKomgaOperations,
} as const;

export type KomgaOperationId = keyof typeof komgaOperationDefinitions;
