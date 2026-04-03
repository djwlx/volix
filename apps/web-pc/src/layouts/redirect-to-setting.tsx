import { Navigate } from 'react-router';

function RedirectToSetting() {
  return <Navigate to="/setting/info" replace />;
}

export default RedirectToSetting;
