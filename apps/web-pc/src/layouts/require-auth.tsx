import { Navigate, Outlet, useLocation } from 'react-router';
import { isAuthenticated } from '@/utils';
import { useUser } from '@/hooks';

function RequireAuth() {
  const location = useLocation();
  const { loading } = useUser();

  if (!isAuthenticated()) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/auth" replace state={{ from }} />;
  }

  if (loading) {
    return <div style={{ padding: 20 }}>加载中...</div>;
  }

  return <Outlet />;
}

export default RequireAuth;
