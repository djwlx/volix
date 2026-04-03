export const isAuthError = (error: unknown) => {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 401 || status === 403;
};

export const getHttpErrorMessage = (error: unknown, fallback = '请求失败，请稍后重试') => {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
};
