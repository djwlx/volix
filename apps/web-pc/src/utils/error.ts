import { translateClient } from '@/i18n';

export const isAuthError = (error: unknown) => {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 401 || status === 403;
};

export const getHttpErrorMessage = (
  error: unknown,
  fallback = translateClient({
    id: 'common.error.requestFailed',
    defaultMessage: '请求失败，请稍后重试',
  })
) => {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
};

export const getDisplayErrorMessage = (
  error: unknown,
  fallback = translateClient({
    id: 'common.error.requestFailed',
    defaultMessage: '请求失败，请稍后重试',
  })
) => {
  const httpMessage = getHttpErrorMessage(error, '');
  if (httpMessage) {
    return httpMessage;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
};
