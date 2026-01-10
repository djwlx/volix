import { Image, Button, Space } from '@douyinfe/semi-ui';
import { IconArrowRight, IconLikeHeart } from '@douyinfe/semi-icons';
import { useState } from 'react';

function PicApp() {
  const [url, setUrl] = useState('/api/115/pic?mode=direct');

  return (
    <div>
      <center>
        <Space style={{ margin: '10px 0' }}>
          <Button
            icon={<IconArrowRight />}
            aria-label="下一张"
            onClick={() => {
              setUrl(`/api/115/pic?mode=direct&key=${Math.random()}`);
            }}
          />
          <Button icon={<IconLikeHeart style={{ color: 'red' }} />} aria-label="喜欢" />
        </Space>
      </center>

      <Image width={'100%'} src={url} />
    </div>
  );
}
export default PicApp;
