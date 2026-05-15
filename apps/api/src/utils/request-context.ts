import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextValue {
  userAgent?: string;
  actingUserId?: string;
}

const requestContextStorage = new AsyncLocalStorage<RequestContextValue>();

export const runWithRequestContext = async <T>(context: RequestContextValue, runner: () => Promise<T>) => {
  return requestContextStorage.run(context, runner);
};

export const getRequestContext = () => {
  return requestContextStorage.getStore();
};

export const getRequestUserAgent = () => {
  return String(getRequestContext()?.userAgent || '').trim() || undefined;
};

export const setRequestContext = (next: Partial<RequestContextValue>) => {
  const store = requestContextStorage.getStore();
  if (!store || !next || typeof next !== 'object') {
    return;
  }
  Object.assign(store, next);
};

export const getRequestActingUserId = () => {
  return String(getRequestContext()?.actingUserId || '').trim() || undefined;
};
