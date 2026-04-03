const AUTH_STORAGE_KEY = 'volix-token';
const TOKEN_HEADER_KEY = 'volix-token';

export const getAuthToken = () => {
  return localStorage.getItem(AUTH_STORAGE_KEY);
};

export const setAuthToken = (token: string) => {
  localStorage.setItem(AUTH_STORAGE_KEY, token);
};

export const clearAuthToken = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const isAuthenticated = () => {
  return Boolean(getAuthToken());
};

export const getTokenHeaderKey = () => TOKEN_HEADER_KEY;
