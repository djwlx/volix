import { useMemo, type ReactNode } from 'react';
import { Navigate, Outlet, useMatches, useNavigate } from 'react-router';
import { Loading, AppHeader } from '@/components';
import { useUserStore } from '@/stores';
import styles from './app-shell.module.scss';

export interface AppRouteHandle {
  appHeader?: {
    title: string;
    description?: string;
    logo: ReactNode;
  } | null;
  requiresAuth?: boolean;
  contentSpacing?: 'default' | 'flush';
}

function AppShell() {
  const navigate = useNavigate();
  const matches = useMatches();
  const currentUser = useUserStore(state => state.currentUser);
  const userLoading = useUserStore(state => state.userLoading);
  const authInitialized = useUserStore(state => state.authInitialized);

  const resolvedHandle = useMemo(() => {
    const matchedHandles = matches.map(match => match.handle as AppRouteHandle | undefined).filter(Boolean);
    const settingMatch = matches.find(match => match.pathname === '/setting');
    const settingHeader = (settingMatch?.handle as AppRouteHandle | undefined)?.appHeader;
    const isSettingPage = matches.some(match => match.pathname.startsWith('/setting'));

    const headerOwner = [...matchedHandles]
      .reverse()
      .find(item => Object.prototype.hasOwnProperty.call(item ?? {}, 'appHeader'));
    const appHeader = isSettingPage ? settingHeader : headerOwner?.appHeader;
    const requiresAuth = matchedHandles.some(item => item?.requiresAuth);
    const contentSpacingOwner = [...matchedHandles]
      .reverse()
      .find(item => Object.prototype.hasOwnProperty.call(item ?? {}, 'contentSpacing'));
    const contentSpacing = contentSpacingOwner?.contentSpacing || 'default';

    return {
      appHeader,
      requiresAuth,
      contentSpacing,
    };
  }, [matches]);

  if (resolvedHandle.requiresAuth && (!authInitialized || userLoading)) {
    return <Loading type="page" text="正在加载页面..." />;
  }

  if (resolvedHandle.requiresAuth && !currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.shell}>
      {resolvedHandle.appHeader ? (
        <AppHeader
          title={resolvedHandle.appHeader.title}
          description={resolvedHandle.appHeader.description}
          logo={resolvedHandle.appHeader.logo}
          onLogoClick={() => navigate('/')}
        />
      ) : null}
      <div className={`${styles.content} ${resolvedHandle.contentSpacing === 'flush' ? styles.contentFlush : ''}`}>
        <Outlet />
      </div>
    </div>
  );
}

export default AppShell;
