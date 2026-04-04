import { Avatar, Dropdown, Nav, Typography } from '@douyinfe/semi-ui';
import { AppCard } from './components';
import { IconAvatar, IconImage } from '@douyinfe/semi-icons-lab';
import { IconApps, IconExit, IconSetting } from '@douyinfe/semi-icons';
import { clearAuthToken } from '@/utils';
import { useNavigate } from 'react-router';
import { AppFeature } from '@volix/types';
import { useUser } from '@/hooks';

function HomeApp() {
  const navigate = useNavigate();
  const { user } = useUser();

  const onLogout = () => {
    clearAuthToken();
    navigate('/auth', { replace: true });
  };

  return (
    <div style={{ width: '100%' }}>
      <Nav
        header={{
          logo: (
            <div
              onClick={() => navigate('/')}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #14B8A6 0%, #22C55E 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <IconApps style={{ fontSize: 20, color: '#fff' }} />
            </div>
          ),
          text: '我的应用',
        }}
        footer={
          <Dropdown
            trigger="click"
            position="bottomRight"
            render={
              <Dropdown.Menu>
                <Dropdown.Item icon={<IconSetting />} onClick={() => navigate('/setting/info')}>
                  系统管理
                </Dropdown.Item>
                <Dropdown.Item icon={<IconExit />} type="danger" onClick={onLogout}>
                  退出登录
                </Dropdown.Item>
              </Dropdown.Menu>
            }
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar size="small" color="blue" src={user?.avatar}>
                {user?.nickname?.slice(0, 1) || user?.email?.slice(0, 1)?.toUpperCase() || 'U'}
              </Avatar>
              <Typography.Text>{user?.nickname || user?.email}</Typography.Text>
            </div>
          </Dropdown>
        }
        mode={'horizontal'}
      />
      <div style={{ padding: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {user?.featurePermissions?.includes(AppFeature.ACCOUNT_115) ? (
          <AppCard title="我的115" icon={<IconAvatar size="extra-large" />} link="/115" />
        ) : null}
        {user?.featurePermissions?.includes(AppFeature.RANDOM_PIC) ? (
          <AppCard title="随机图片" icon={<IconImage size="extra-large" />} link="/pic" />
        ) : null}
      </div>
    </div>
  );
}

export default HomeApp;
