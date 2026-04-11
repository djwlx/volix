import { Avatar, Dropdown, Nav, Typography } from '@douyinfe/semi-ui';
import { AppCard } from './components';
import { IconImage } from '@douyinfe/semi-icons-lab';
import { IconApps, IconExit, IconSetting } from '@douyinfe/semi-icons';
import { clearAuthToken, isAuthenticated } from '@/utils';
import { useNavigate } from 'react-router';
import { useIsMobile, useUser } from '@/hooks';

function HomeApp() {
  const navigate = useNavigate();
  const { user } = useUser();
  const isMobile = useIsMobile();
  const authed = isAuthenticated();

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
                {authed ? (
                  <>
                    <Dropdown.Item icon={<IconSetting />} onClick={() => navigate('/setting/info')}>
                      系统管理
                    </Dropdown.Item>
                    <Dropdown.Item icon={<IconExit />} type="danger" onClick={onLogout}>
                      退出登录
                    </Dropdown.Item>
                  </>
                ) : (
                  <Dropdown.Item icon={<IconSetting />} onClick={() => navigate('/auth')}>
                    去登录
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            }
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', minWidth: 0 }}>
              <Avatar
                size="32px"
                shape="circle"
                color="blue"
                src={user?.avatar}
                imgAttr={{ style: { objectFit: 'cover' } }}
                style={{ flex: '0 0 32px' }}
              >
                {user?.nickname?.slice(0, 1) || user?.email?.slice(0, 1)?.toUpperCase() || 'U'}
              </Avatar>
              <Typography.Text ellipsis style={{ minWidth: 0 }}>
                {user?.nickname || user?.email}
              </Typography.Text>
            </div>
          </Dropdown>
        }
        mode={'horizontal'}
      />
      <div
        style={{
          padding: 16,
          display: 'grid',
          gap: 12,
          gridTemplateColumns: isMobile
            ? 'repeat(2, minmax(0, 1fr))'
            : 'repeat(auto-fill, minmax(min(220px, 100%), 280px))',
          justifyContent: isMobile ? 'stretch' : 'start',
          alignItems: 'stretch',
        }}
      >
        <AppCard title="随机图片" icon={<IconImage size="extra-large" />} link="/pic" />
        {authed ? <AppCard title="后台管理" icon={<IconSetting size="extra-large" />} link="/setting/info" /> : null}
      </div>
    </div>
  );
}

export default HomeApp;
