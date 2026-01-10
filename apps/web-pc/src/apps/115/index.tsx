import { useEffect, useState } from 'react';
import { UserInfo } from './user-info';

function My115App() {
  const [hasLogin, setHasLogin] = useState(true);

  useEffect(() => {}, []);

  return <div style={{ padding: 16 }}>{hasLogin ? <UserInfo /> : null}</div>;
}
export default My115App;
