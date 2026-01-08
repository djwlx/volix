export interface ResponseType<T> {
  code: number;
  message: string;
  data: T;
}

export * from './115';
