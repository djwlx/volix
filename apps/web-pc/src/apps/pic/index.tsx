import { Image, Button, Space } from '@douyinfe/semi-ui';
import { IconArrowRight, IconLikeHeart } from '@douyinfe/semi-icons';

function PicApp() {
  return (
    <div>
      <center>
        <Space style={{ margin: '10px 0' }}>
          <Button icon={<IconArrowRight />} aria-label="下一张" />
          <Button icon={<IconLikeHeart style={{ color: 'red' }} />} aria-label="喜欢" />
        </Space>
      </center>

      <Image width={'100%'} src="/api/115/pic?mode=direct" />
    </div>
  );
}
export default PicApp;
