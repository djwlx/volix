import type { AxiosRequestConfig, Method } from 'axios';
import request from '../../utils/request';
import { getRequestUserAgent } from '../../utils/request-context';

export interface CreateBangumiSdkOptions {
  apiHost?: string;
  accessToken?: string;
  userAgent?: string;
}

export interface BangumiRequestOptions {
  path: string;
  method?: Method;
  params?: Record<string, unknown>;
  data?: unknown;
  requireAuth?: boolean;
}

export interface BangumiSearchQuery {
  limit?: number;
  offset?: number;
}

export interface BangumiSearchRequest {
  keyword: string;
  sort?: 'match' | 'heat' | 'rank' | 'score';
  filter?: Record<string, unknown>;
}

export interface BangumiCollectionQuery {
  subjectType?: number;
  type?: number;
  limit?: number;
  offset?: number;
}

const DEFAULT_HOST = 'https://api.bgm.tv';
const DEFAULT_BANGUMI_USER_AGENT = 'djwl/volix';

const normalizePath = (path: string) => {
  const text = String(path || '').trim();
  if (!text) {
    throw new Error('Bangumi path 不能为空');
  }
  return text.startsWith('/') ? text : `/${text}`;
};

const normalizeNumberParams = (input?: { limit?: number; offset?: number }) => ({
  ...(input?.limit !== undefined ? { limit: Number(input.limit) } : {}),
  ...(input?.offset !== undefined ? { offset: Number(input.offset) } : {}),
});

export function createBangumiSdk(options?: CreateBangumiSdkOptions) {
  const apiHost = String(options?.apiHost || DEFAULT_HOST)
    .trim()
    .replace(/\/+$/, '');
  const userAgent = String(options?.userAgent || getRequestUserAgent() || DEFAULT_BANGUMI_USER_AGENT).trim();
  let accessToken = String(options?.accessToken || '').trim();

  const requestBangumi = async <T = unknown>(params: BangumiRequestOptions) => {
    if (params.requireAuth && !accessToken) {
      throw new Error('Bangumi access token 不存在');
    }

    const config: AxiosRequestConfig = {
      baseURL: apiHost,
      url: normalizePath(params.path),
      method: params.method || 'GET',
      params: params.params,
      data: params.data,
      headers: {
        Accept: 'application/json',
        ...(userAgent ? { 'User-Agent': userAgent } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    };

    const response = await request<T>(config);
    return response.data;
  };

  const setAccessToken = (nextAccessToken?: string) => {
    accessToken = String(nextAccessToken || '').trim();
  };

  const clearAccessToken = () => {
    accessToken = '';
  };

  return {
    getAccessToken: () => accessToken,
    setAccessToken,
    clearAccessToken,
    requestBangumi,
    getCalendar: () => requestBangumi({ path: '/calendar' }),
    searchSubjects: (body: BangumiSearchRequest, query?: BangumiSearchQuery) =>
      requestBangumi({
        path: '/v0/search/subjects',
        method: 'POST',
        params: normalizeNumberParams(query),
        data: body,
      }),
    searchCharacters: (body: BangumiSearchRequest, query?: BangumiSearchQuery) =>
      requestBangumi({
        path: '/v0/search/characters',
        method: 'POST',
        params: normalizeNumberParams(query),
        data: body,
      }),
    searchPersons: (body: BangumiSearchRequest, query?: BangumiSearchQuery) =>
      requestBangumi({
        path: '/v0/search/persons',
        method: 'POST',
        params: normalizeNumberParams(query),
        data: body,
      }),
    getSubjects: (query?: Record<string, unknown>) =>
      requestBangumi({
        path: '/v0/subjects',
        params: query,
      }),
    getSubjectById: (subjectId: string | number) => requestBangumi({ path: `/v0/subjects/${subjectId}` }),
    getSubjectImageById: (subjectId: string | number) => requestBangumi({ path: `/v0/subjects/${subjectId}/image` }),
    getRelatedPersonsBySubjectId: (subjectId: string | number) =>
      requestBangumi({ path: `/v0/subjects/${subjectId}/persons` }),
    getRelatedCharactersBySubjectId: (subjectId: string | number) =>
      requestBangumi({ path: `/v0/subjects/${subjectId}/characters` }),
    getRelatedSubjectsBySubjectId: (subjectId: string | number) =>
      requestBangumi({ path: `/v0/subjects/${subjectId}/subjects` }),
    getEpisodes: (query?: Record<string, unknown>) =>
      requestBangumi({
        path: '/v0/episodes',
        params: query,
      }),
    getEpisodeById: (episodeId: string | number) => requestBangumi({ path: `/v0/episodes/${episodeId}` }),
    getCharacterById: (characterId: string | number) => requestBangumi({ path: `/v0/characters/${characterId}` }),
    getRelatedSubjectsByCharacterId: (characterId: string | number) =>
      requestBangumi({ path: `/v0/characters/${characterId}/subjects` }),
    getRelatedPersonsByCharacterId: (characterId: string | number) =>
      requestBangumi({ path: `/v0/characters/${characterId}/persons` }),
    collectCharacter: (characterId: string | number) =>
      requestBangumi({
        path: `/v0/characters/${characterId}/collect`,
        method: 'POST',
        requireAuth: true,
      }),
    uncollectCharacter: (characterId: string | number) =>
      requestBangumi({
        path: `/v0/characters/${characterId}/collect`,
        method: 'DELETE',
        requireAuth: true,
      }),
    getPersonById: (personId: string | number) => requestBangumi({ path: `/v0/persons/${personId}` }),
    getRelatedSubjectsByPersonId: (personId: string | number) =>
      requestBangumi({ path: `/v0/persons/${personId}/subjects` }),
    getRelatedCharactersByPersonId: (personId: string | number) =>
      requestBangumi({ path: `/v0/persons/${personId}/characters` }),
    collectPerson: (personId: string | number) =>
      requestBangumi({
        path: `/v0/persons/${personId}/collect`,
        method: 'POST',
        requireAuth: true,
      }),
    uncollectPerson: (personId: string | number) =>
      requestBangumi({
        path: `/v0/persons/${personId}/collect`,
        method: 'DELETE',
        requireAuth: true,
      }),
    getUserByName: (username: string) => requestBangumi({ path: `/v0/users/${username}` }),
    getUserAvatarByName: (username: string) => requestBangumi({ path: `/v0/users/${username}/avatar` }),
    getMyself: () =>
      requestBangumi({
        path: '/v0/me',
        requireAuth: true,
      }),
    getUserCollections: (username: string, query?: BangumiCollectionQuery) =>
      requestBangumi({
        path: `/v0/users/${username}/collections`,
        params: {
          ...(query?.subjectType !== undefined ? { subject_type: query.subjectType } : {}),
          ...(query?.type !== undefined ? { type: query.type } : {}),
          ...normalizeNumberParams(query),
        },
      }),
    getUserCollection: (username: string, subjectId: string | number) =>
      requestBangumi({
        path: `/v0/users/${username}/collections/${subjectId}`,
      }),
    upsertUserCollection: (subjectId: string | number, body?: Record<string, unknown>) =>
      requestBangumi({
        path: `/v0/users/-/collections/${subjectId}`,
        method: 'POST',
        data: body || {},
        requireAuth: true,
      }),
    patchUserCollection: (subjectId: string | number, body?: Record<string, unknown>) =>
      requestBangumi({
        path: `/v0/users/-/collections/${subjectId}`,
        method: 'PATCH',
        data: body || {},
        requireAuth: true,
      }),
    getUserSubjectEpisodeCollection: (subjectId: string | number) =>
      requestBangumi({
        path: `/v0/users/-/collections/${subjectId}/episodes`,
        requireAuth: true,
      }),
    patchUserSubjectEpisodeCollection: (subjectId: string | number, body?: Record<string, unknown>) =>
      requestBangumi({
        path: `/v0/users/-/collections/${subjectId}/episodes`,
        method: 'PATCH',
        data: body || {},
        requireAuth: true,
      }),
    getUserEpisodeCollection: (episodeId: string | number) =>
      requestBangumi({
        path: `/v0/users/-/collections/-/episodes/${episodeId}`,
        requireAuth: true,
      }),
    updateUserEpisodeCollection: (episodeId: string | number, body?: Record<string, unknown>) =>
      requestBangumi({
        path: `/v0/users/-/collections/-/episodes/${episodeId}`,
        method: 'PUT',
        data: body || {},
        requireAuth: true,
      }),
    getUserCharacterCollections: (username: string) =>
      requestBangumi({
        path: `/v0/users/${username}/collections/-/characters`,
      }),
    getUserCharacterCollection: (username: string, characterId: string | number) =>
      requestBangumi({
        path: `/v0/users/${username}/collections/-/characters/${characterId}`,
      }),
    getUserPersonCollections: (username: string) =>
      requestBangumi({
        path: `/v0/users/${username}/collections/-/persons`,
      }),
    getUserPersonCollection: (username: string, personId: string | number) =>
      requestBangumi({
        path: `/v0/users/${username}/collections/-/persons/${personId}`,
      }),
    getPersonRevisions: (query?: Record<string, unknown>) =>
      requestBangumi({ path: '/v0/revisions/persons', params: query }),
    getPersonRevisionByRevisionId: (revisionId: string | number) =>
      requestBangumi({ path: `/v0/revisions/persons/${revisionId}` }),
    getCharacterRevisions: (query?: Record<string, unknown>) =>
      requestBangumi({ path: '/v0/revisions/characters', params: query }),
    getCharacterRevisionByRevisionId: (revisionId: string | number) =>
      requestBangumi({ path: `/v0/revisions/characters/${revisionId}` }),
    getSubjectRevisions: (query?: Record<string, unknown>) =>
      requestBangumi({ path: '/v0/revisions/subjects', params: query }),
    getSubjectRevisionByRevisionId: (revisionId: string | number) =>
      requestBangumi({ path: `/v0/revisions/subjects/${revisionId}` }),
    getEpisodeRevisions: (query?: Record<string, unknown>) =>
      requestBangumi({ path: '/v0/revisions/episodes', params: query }),
    getEpisodeRevisionByRevisionId: (revisionId: string | number) =>
      requestBangumi({ path: `/v0/revisions/episodes/${revisionId}` }),
    createIndex: (body: Record<string, unknown>) =>
      requestBangumi({
        path: '/v0/indices',
        method: 'POST',
        data: body,
        requireAuth: true,
      }),
    getIndexById: (indexId: string | number) => requestBangumi({ path: `/v0/indices/${indexId}` }),
    updateIndexById: (indexId: string | number, body: Record<string, unknown>) =>
      requestBangumi({
        path: `/v0/indices/${indexId}`,
        method: 'PUT',
        data: body,
        requireAuth: true,
      }),
    getIndexSubjectsByIndexId: (indexId: string | number, query?: Record<string, unknown>) =>
      requestBangumi({
        path: `/v0/indices/${indexId}/subjects`,
        params: query,
      }),
    addSubjectToIndexByIndexId: (indexId: string | number, body: Record<string, unknown>) =>
      requestBangumi({
        path: `/v0/indices/${indexId}/subjects`,
        method: 'POST',
        data: body,
        requireAuth: true,
      }),
    editIndexSubjectsByIndexIdAndSubjectId: (
      indexId: string | number,
      subjectId: string | number,
      body: Record<string, unknown>
    ) =>
      requestBangumi({
        path: `/v0/indices/${indexId}/subjects/${subjectId}`,
        method: 'PUT',
        data: body,
        requireAuth: true,
      }),
    deleteSubjectFromIndexByIndexIdAndSubjectId: (indexId: string | number, subjectId: string | number) =>
      requestBangumi({
        path: `/v0/indices/${indexId}/subjects/${subjectId}`,
        method: 'DELETE',
        requireAuth: true,
      }),
    collectIndexByIndexId: (indexId: string | number) =>
      requestBangumi({
        path: `/v0/indices/${indexId}/collect`,
        method: 'POST',
        requireAuth: true,
      }),
    uncollectIndexByIndexId: (indexId: string | number) =>
      requestBangumi({
        path: `/v0/indices/${indexId}/collect`,
        method: 'DELETE',
        requireAuth: true,
      }),
  };
}

export type BangumiSdk = ReturnType<typeof createBangumiSdk>;
