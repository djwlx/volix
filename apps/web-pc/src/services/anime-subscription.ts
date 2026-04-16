import { http } from '@/utils';
import type {
  AnimeSubscriptionItemResponse,
  AnimeSubscriptionLogResponse,
  AnimeSubscriptionResponse,
  CreateAnimeSubscriptionPayload,
  TriggerAnimeSubscriptionCheckResponse,
  UpdateAnimeSubscriptionPayload,
} from '@volix/types';

export const getAnimeSubscriptionList = () => {
  return http.get<AnimeSubscriptionResponse[]>('/anime-subscriptions');
};

export const getAnimeSubscriptionDetail = (id: string | number) => {
  return http.get<AnimeSubscriptionResponse>(`/anime-subscriptions/${id}`);
};

export const createAnimeSubscription = (data: CreateAnimeSubscriptionPayload) => {
  return http.post<AnimeSubscriptionResponse>('/anime-subscriptions', data);
};

export const updateAnimeSubscription = (id: string | number, data: UpdateAnimeSubscriptionPayload) => {
  return http.put<AnimeSubscriptionResponse>(`/anime-subscriptions/${id}`, data);
};

export const toggleAnimeSubscription = (id: string | number) => {
  return http.post<AnimeSubscriptionResponse>(`/anime-subscriptions/${id}/toggle`);
};

export const triggerAnimeSubscriptionCheck = (id: string | number) => {
  return http.post<TriggerAnimeSubscriptionCheckResponse>(`/anime-subscriptions/${id}/check-now`);
};

export const getAnimeSubscriptionItems = (id: string | number) => {
  return http.get<AnimeSubscriptionItemResponse[]>(`/anime-subscriptions/${id}/items`);
};

export const getAnimeSubscriptionLogs = (id: string | number) => {
  return http.get<AnimeSubscriptionLogResponse>(`/anime-subscriptions/${id}/logs`);
};
