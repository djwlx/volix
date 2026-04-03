import { Navigate, Outlet, useLocation } from 'react-router';
import { isAuthenticated } from '@/utils';

function RequireAuth() {
  const location = useLocation();

  if (!isAuthenticated()) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/auth" replace state={{ from }} />;
  }
  return <Outlet />;
}

export default RequireAuth;
