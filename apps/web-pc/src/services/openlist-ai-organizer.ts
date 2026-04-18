import { http } from '@/utils';
import type {
  AnalyzeOpenlistAiOrganizerPayload,
  CreateOpenlistAiOrganizerAnalyzeTaskResponse,
  DeleteOpenlistAiOrganizerDuplicateFolderResponse,
  CreateOpenlistAiOrganizerExecuteTaskResponse,
  CreateOpenlistAiOrganizerReviseTaskResponse,
  CreateOpenlistAiOrganizerRetryTaskResponse,
  ExecuteOpenlistAiOrganizerPayload,
  OpenlistAiOrganizerBrowseResponse,
  OpenlistAiOrganizerTaskDetail,
  OpenlistAiOrganizerTaskListResponse,
  ReviseOpenlistAiOrganizerAnalyzeTaskPayload,
} from '@volix/types';

export const browseOpenlistAiOrganizerPath = (path = '/') => {
  return http.get<OpenlistAiOrganizerBrowseResponse>('/openlist-ai-organizer/browse', {
    params: {
      path,
    },
  });
};

export const analyzeOpenlistAiOrganizer = (data: AnalyzeOpenlistAiOrganizerPayload) => {
  return http.post<CreateOpenlistAiOrganizerAnalyzeTaskResponse>('/openlist-ai-organizer/analyze', data);
};

export const executeOpenlistAiOrganizer = (data: ExecuteOpenlistAiOrganizerPayload) => {
  return http.post<CreateOpenlistAiOrganizerExecuteTaskResponse>('/openlist-ai-organizer/execute', data);
};

export const reviseOpenlistAiOrganizerAnalyzeTask = (id: string, data: ReviseOpenlistAiOrganizerAnalyzeTaskPayload) => {
  return http.post<CreateOpenlistAiOrganizerReviseTaskResponse>(`/openlist-ai-organizer/tasks/${id}/revise`, data);
};

export const retryOpenlistAiOrganizerTask = (id: string) => {
  return http.post<CreateOpenlistAiOrganizerRetryTaskResponse>(`/openlist-ai-organizer/tasks/${id}/retry`);
};

export const deleteOpenlistAiOrganizerDuplicateFolder = (id: string) => {
  return http.post<DeleteOpenlistAiOrganizerDuplicateFolderResponse>(
    `/openlist-ai-organizer/tasks/${id}/delete-duplicate-folder`
  );
};

export const getOpenlistAiOrganizerTaskList = () => {
  return http.get<OpenlistAiOrganizerTaskListResponse>('/openlist-ai-organizer/tasks');
};

export const getOpenlistAiOrganizerTaskDetail = (id: string) => {
  return http.get<OpenlistAiOrganizerTaskDetail>(`/openlist-ai-organizer/tasks/${id}`);
};
