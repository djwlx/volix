export interface ResponseData<T = any> {
  code: number;
  message: string;
  data: T;
}

export * from './115';
export * from './user';
export * from './file';
