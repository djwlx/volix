import { http } from '@/utils';
import type {
  AnimeSyncEpisodeJob,
  AnimeSyncOverview,
  AnimeSyncRunResult,
  AnimeSyncSubscription,
  CreateAnimeSyncSubscriptionPayload,
  UpdateAnimeSyncSubscriptionPayload,
} from '@volix/types';

export const getAnimeSyncOverview = () => {
  return http.get<AnimeSyncOverview>('/anime-sync/overview');
};

export const getAnimeSyncSubscriptions = () => {
  return http.get<AnimeSyncSubscription[]>('/anime-sync/subscriptions');
};

export const createAnimeSyncSubscription = (data: CreateAnimeSyncSubscriptionPayload) => {
  return http.post<AnimeSyncSubscription>('/anime-sync/subscriptions', data);
};

export const updateAnimeSyncSubscription = (id: number, data: UpdateAnimeSyncSubscriptionPayload) => {
  return http.put<AnimeSyncSubscription>(`/anime-sync/subscriptions/${id}`, data);
};

export const deleteAnimeSyncSubscription = (id: number) => {
  return http.delete<{ success: boolean }>(`/anime-sync/subscriptions/${id}`);
};

export const toggleAnimeSyncSubscription = (id: number) => {
  return http.post<AnimeSyncSubscription>(`/anime-sync/subscriptions/${id}/toggle`);
};

export const runAnimeSync = () => {
  return http.post<AnimeSyncRunResult>('/anime-sync/run');
};

export const runAnimeSyncBySubscription = (id: number) => {
  return http.post<AnimeSyncRunResult>(`/anime-sync/subscriptions/${id}/run`);
};

export const getAnimeSyncJobs = (subscriptionId?: number) => {
  return http.get<AnimeSyncEpisodeJob[]>('/anime-sync/jobs', {
    params: subscriptionId ? { subscriptionId } : undefined,
  });
};

export const retryAnimeSyncJob = (id: number) => {
  return http.post<AnimeSyncEpisodeJob>(`/anime-sync/jobs/${id}/retry`);
};

export const skipAnimeSyncJob = (id: number) => {
  return http.post<AnimeSyncEpisodeJob>(`/anime-sync/jobs/${id}/skip`);
};
