import { useEffect, useState } from 'react';
import { UserInfo } from './user-info';
import { PicSetting } from './pic-setting';
import { Space } from '@douyinfe/semi-ui';

function My115App() {
  const [hasLogin, setHasLogin] = useState(true);

  useEffect(() => {}, []);

  return (
    <div style={{ padding: 16 }}>
      {hasLogin ? (
        <Space spacing="medium" vertical style={{ width: '100%' }}>
          <UserInfo />
          <PicSetting />
        </Space>
      ) : null}
    </div>
  );
}
export default My115App;
