import { IconArrowUp, IconExit } from '@douyinfe/semi-icons';
import { Card, Avatar, Space, Button, Typography, Descriptions, Tag } from '@douyinfe/semi-ui';
import styles from './index.module.scss';

export function UserInfo() {
  const { Meta } = Card;
  const { Text } = Typography;

  return (
    <Card
      className={styles.card}
      title={
        <Space>
          <Avatar
            alt="Card meta img"
            size="default"
            src="https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/card-meta-avatar-docs-demo.jpg"
          />
          <span style={{ fontWeight: '500' }}>低级亡灵</span>
        </Space>
      }
      headerExtraContent={<Button icon={<IconExit />} style={{ color: '#E91E63' }} aria-label="退出" />}
      style={{ width: '100%' }}
      shadows="hover"
    />
  );
}
