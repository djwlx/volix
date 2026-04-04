import { Navigate, Outlet, useLocation } from 'react-router';
import { isAuthenticated } from '@/utils';
import { useUser } from '@/hooks';

function RequireAuth() {
  const location = useLocation();
  const { loading, error } = useUser();

  if (!isAuthenticated()) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/auth" replace state={{ from }} />;
  }

  // 如果加载出错（包括 401），显示加载状态
  if (loading) {
    return <div style={{ padding: 20 }}>加载用户信息中...</div>;
  }

  // 如果有错误且是认证错误，重定向到登录页
  if (error && error.includes('未授权')) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}

export default RequireAuth;
