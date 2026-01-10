import { Nav } from '@douyinfe/semi-ui';
import { AppCard } from './components';
import { IconAvatar, IconImage, IconList } from '@douyinfe/semi-icons-lab';

function HomeApp() {
  return (
    <div style={{ width: '100%' }}>
      <Nav
        header={{
          logo: <IconList style={{ height: '36px', fontSize: 36 }} />,
          text: '我的应用',
        }}
        mode={'horizontal'}
      />
      <div style={{ padding: 16, display: 'flex', gap: 8 }}>
        <AppCard title="我的115" icon={<IconAvatar size="extra-large" />} link="/115" />
        <AppCard title="随机图片" icon={<IconImage size="extra-large" />} link="/pic" />
      </div>
    </div>
  );
}

export default HomeApp;
