import 'reset-css/reset.css';
import '@/styles/global.css';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { ensureI18n, I18nProvider } from '@/i18n';
import { router } from '@/layouts/router';
import { formatTime } from '@volix/utils';
import { initializeTheme } from '@/utils/theme';
import { useUserStore } from '@/stores';

formatTime();
initializeTheme();

function AppRoot() {
  const initializeAuth = useUserStore(state => state.initializeAuth);
  const clearAuth = useUserStore(state => state.clearAuth);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuth();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [clearAuth]);

  return <RouterProvider router={router} />;
}

void ensureI18n().then(() => {
  createRoot(document.getElementById('root')!).render(
    <I18nProvider>
      <AppRoot />
    </I18nProvider>
  );
});
