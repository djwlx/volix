import { Outlet } from 'react-router';

/**
 * Guest Allowed Layout
 * 允许未登录用户访问指定路由（如 /pic）
 */
function GuestAllowed() {
  return <Outlet />;
}

export default GuestAllowed;
