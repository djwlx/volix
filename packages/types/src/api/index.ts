export interface ResponseData<T = any> {
  code: number;
  message: string;
  data: T;
}

export * from './115';
export * from './anime-subscription';
export * from './user';
export * from './file';
export * from './openlist-ai-organizer';
export * from './ai';
export * from './sqlite-admin';
export * from './scheduled-task';
