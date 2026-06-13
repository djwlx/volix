import { http } from '@/utils';
import type { CreateWebsocketTicketResult } from './ws-protocol';

export const createWebsocketTicket = async (): Promise<CreateWebsocketTicketResult> => {
  const response = await http.post<CreateWebsocketTicketResult>('/ws/ticket');
  return response.data;
};
