export interface ResponseData<T = any> {
  code: number;
  message: string;
  data: T;
}

export * from './115';
