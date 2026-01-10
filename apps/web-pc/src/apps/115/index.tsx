import { useEffect, useState } from 'react';
import { UserInfo } from './user-info';
import { PicSetting } from './pic-setting';
import { Space } from '@douyinfe/semi-ui';
import { FileTree } from './file-tree';

function My115App() {
  const [hasLogin, setHasLogin] = useState(true);

  useEffect(() => {}, []);

  return (
    <div style={{ padding: 16 }}>
      {hasLogin ? (
        <Space spacing="medium" vertical style={{ width: '100%' }}>
          <UserInfo />
          <PicSetting />
          <FileTree />
        </Space>
      ) : null}
    </div>
  );
}
export default My115App;
