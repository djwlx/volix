import { useState } from 'react';
import UserInfo from '../../components/info';
import FileList from '../../components/file';
import Picture from '../../components/picture';
import { Space } from 'antd';

function App115() {
  const [userInfo, setUserInfo] = useState<any>();

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <UserInfo userInfo={userInfo} setUserInfo={setUserInfo} />
      {userInfo && <Picture />}
      {userInfo && <FileList />}
    </Space>
  );
}

export default App115;
