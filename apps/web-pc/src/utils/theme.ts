import { useGlobalConfigStore } from '@/stores';

export type AppTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'volix_theme';

const applyTheme = (theme: AppTheme) => {
  if (theme === 'dark') {
    document.body.setAttribute('theme-mode', 'dark');
  } else {
    document.body.removeAttribute('theme-mode');
  }
};

const getSystemTheme = (): AppTheme => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const getStoredTheme = (): AppTheme | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const theme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return theme === 'light' || theme === 'dark' ? theme : null;
};

export const initializeTheme = () => {
  const theme = getStoredTheme() || getSystemTheme();
  useGlobalConfigStore.getState().setConfig({ theme });
  applyTheme(theme);
};

export const setAppTheme = (theme: AppTheme) => {
  useGlobalConfigStore.getState().setConfig({ theme });
  applyTheme(theme);
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
};
