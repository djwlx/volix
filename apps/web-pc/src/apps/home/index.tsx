import { Nav, Card, Avatar } from '@douyinfe/semi-ui';
import { IconSemiLogo } from '@douyinfe/semi-icons';

const { Meta } = Card;
function HomeApp() {
  return (
    <div style={{ width: '100%' }}>
      <Nav
        header={{
          logo: <IconSemiLogo style={{ height: '36px', fontSize: 36 }} />,
          text: '我的应用',
        }}
        mode={'horizontal'}
      />

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <Card style={{ width: 220 }} shadows="hover">
          <Meta
            title="我的115"
            avatar={
              <Avatar
                alt="Card meta img"
                size="default"
                src="https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/card-meta-avatar-docs-demo.jpg"
              />
            }
          />
        </Card>
      </div>
    </div>
  );
}

export default HomeApp;
