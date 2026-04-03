import { Navigate, Outlet, useLocation } from 'react-router';
import { isAuthenticated } from '@/utils';

function GuestOnly() {
  const location = useLocation();

  if (isAuthenticated()) {
    const from = (location.state as { from?: string } | null)?.from;
    const target = from && from !== '/auth' ? from : '/';
    return <Navigate to={target} replace />;
  }
  return <Outlet />;
}

export default GuestOnly;
