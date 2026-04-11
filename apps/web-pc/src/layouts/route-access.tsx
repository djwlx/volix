import { Empty } from '@douyinfe/semi-ui';
import type { AppFeature } from '@volix/types';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useUser } from '@/hooks';
import { isAuthenticated } from '@/utils';

interface RouteAccessProps {
  guestOnly?: boolean;
  requireAuth?: boolean;
  requiredFeatures?: AppFeature[];
}

function RouteAccess(props: RouteAccessProps) {
  const { guestOnly = false, requireAuth = false, requiredFeatures } = props;
  const location = useLocation();
  const hasToken = isAuthenticated();
  const shouldLoadUser = requireAuth || Boolean(requiredFeatures?.length) || hasToken;
  const { user, loading } = useUser(shouldLoadUser);

  if (guestOnly) {
    if (hasToken) {
      const from = (location.state as { from?: string } | null)?.from;
      const target = from && from !== '/auth' ? from : '/';
      return <Navigate to={target} replace />;
    }
    return <Outlet />;
  }

  if (requireAuth && !hasToken) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/auth" replace state={{ from }} />;
  }

  if (shouldLoadUser && hasToken && loading) {
    return <div style={{ padding: 20 }}>加载中...</div>;
  }

  if (requiredFeatures?.length) {
    const hasPermission = requiredFeatures.every(feature => user?.featurePermissions?.includes(feature));

    if (!hasPermission) {
      return (
        <div
          style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <Empty title="无权限访问" description="您没有访问此功能的权限，请联系管理员。" style={{ marginTop: -60 }} />
        </div>
      );
    }
  }

  return <Outlet />;
}

export function GuestOnlyRoute() {
  return <RouteAccess guestOnly />;
}

export function RequireAuthRoute() {
  return <RouteAccess requireAuth />;
}

export default RouteAccess;
