import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Dropdown, Nav, Tag, Toast, Typography } from '@douyinfe/semi-ui';
import { IconCloud, IconConfigStroked, IconExit, IconKanban, IconSetting, IconUserGroup, IconUserList } from '@douyinfe/semi-icons';
import { IconAvatar } from '@douyinfe/semi-icons-lab';
import { clearAuthToken, getHttpErrorMessage, isAuthError } from '@/utils';
import { useLocation, useNavigate, Outlet } from 'react-router';
import { getCurrentUser } from '@/services/user';
import { UserRole } from '@volix/types';
import type { UserInfoResponse } from '@volix/types';
import { Loading } from '@/components';
import type { SettingOutletContext } from './types';

function SettingApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserInfoResponse>();
  const [userLoading, setUserLoading] = useState(true);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const leaveGuardRef = useRef<(() => boolean) | null>(null);

  const isAdmin = user?.role === UserRole.ADMIN;

  const refreshUser = async () => {
    const res = await getCurrentUser();
    setUser(res.data);
  };

  const onLogout = useCallback(() => {
    if (leaveGuardRef.current && !leaveGuardRef.current()) {
      return;
    }
    clearAuthToken();
    navigate('/auth', { replace: true });
  }, [navigate]);

  const requestNavigate = useCallback((to: string) => {
    if (leaveGuardRef.current && !leaveGuardRef.current()) {
      return;
    }
    navigate(to);
  }, [navigate]);

  const registerLeaveGuard = useCallback((guard: (() => boolean) | null) => {
    leaveGuardRef.current = guard;
  }, []);

  useEffect(() => {
    setUserLoading(true);
    refreshUser().catch(error => {
      if (isAuthError(error)) {
        onLogout();
        return;
      }
      Toast.error(getHttpErrorMessage(error, '获取用户信息失败，请稍后重试'));
    }).finally(() => {
      setUserLoading(false);
    });
  }, []);

  const activeKey = useMemo(() => {
    if (location.pathname.startsWith('/setting/config/115')) {
      return 'config/115';
    }
    if (location.pathname.startsWith('/setting/config/qbittorrent')) {
      return 'config/qbittorrent';
    }
    if (location.pathname.startsWith('/setting/config/openlist')) {
      return 'config/openlist';
    }
    if (location.pathname.startsWith('/setting/config/smtp')) {
      return 'config/smtp';
    }
    if (location.pathname.startsWith('/setting/system')) {
      return 'system';
    }
    if (location.pathname.startsWith('/setting/role')) {
      return 'role';
    }
    if (location.pathname.startsWith('/setting/user')) {
      return 'user';
    }
    return 'info';
  }, [location.pathname]);

  const navItems = [
    {
      itemKey: 'common-settings',
      text: '普通设置',
      items: [
        {
          itemKey: 'info',
          text: '个人信息',
          icon: <IconAvatar />,
        },
      ],
    },
    ...(isAdmin
      ? [
          {
            itemKey: 'admin-settings',
            text: '管理员设置',
            items: [
              {
                itemKey: 'user',
                text: '用户管理',
                icon: <IconUserList />,
              },
              {
                itemKey: 'role',
                text: '角色管理',
                icon: <IconUserGroup />,
              },
              {
                itemKey: 'system',
                text: '系统配置',
                icon: <IconSetting />,
              },
              {
                itemKey: 'config',
                text: '账号配置',
                icon: <IconConfigStroked />,
                items: [
                  {
                    itemKey: 'config/115',
                    text: '115',
                    icon: <IconCloud />,
                  },
                  {
                    itemKey: 'config/qbittorrent',
                    text: 'qBittorrent',
                    icon: <IconCloud />,
                  },
                  {
                    itemKey: 'config/openlist',
                    text: 'OpenList',
                    icon: <IconCloud />,
                  },
                  {
                    itemKey: 'config/smtp',
                    text: 'SMTP',
                    icon: <IconCloud />,
                  },
                ],
              },
            ],
          },
        ]
      : []),
  ];

  if (userLoading) {
    return <Loading type="page" text="正在加载设置..." />;
  }

  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      <Nav
        mode="horizontal"
        header={{
          logo: (
            <div
              onClick={() => requestNavigate('/')}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <IconKanban style={{ fontSize: 20, color: '#fff' }} />
            </div>
          ),
          text: '后台管理',
        }}
        footer={
          <Dropdown
            trigger="click"
            position="bottomRight"
            render={
              <Dropdown.Menu>
                <Dropdown.Item icon={<IconSetting />} onClick={() => requestNavigate('/setting/info')}>
                  系统管理
                </Dropdown.Item>
                <Dropdown.Item icon={<IconExit />} type="danger" onClick={onLogout}>
                  退出登录
                </Dropdown.Item>
              </Dropdown.Menu>
            }
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar size="small" src={user?.avatar}>
                {user?.nickname?.slice(0, 1) || user?.email?.slice(0, 1)?.toUpperCase() || 'U'}
              </Avatar>
              <Typography.Text>{user?.nickname || user?.email}</Typography.Text>
              <Tag color={isAdmin ? 'red' : 'blue'}>{isAdmin ? '管理员' : '普通用户'}</Tag>
            </div>
          </Dropdown>
        }
      />

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        <Nav
          mode="vertical"
          style={{
            width: isNavCollapsed ? 64 : 240,
            flexShrink: 0,
            borderRight: '1px solid var(--semi-color-border)',
          }}
          bodyStyle={{ paddingTop: 8 }}
          items={navItems}
          selectedKeys={[activeKey]}
          defaultOpenKeys={isAdmin ? ['common-settings', 'admin-settings', 'config'] : ['common-settings']}
          isCollapsed={isNavCollapsed}
          onCollapseChange={setIsNavCollapsed}
          footer={{ collapseButton: true }}
          onSelect={data => {
            const key = data.itemKey;
            if (key === 'config') {
              return;
            }
            if (key === 'user' && !isAdmin) {
              Toast.warning('仅管理员可访问用户信息');
              return;
            }
            requestNavigate(`/setting/${key}`);
          }}
        />
        <div style={{ flex: 1, minWidth: 0, padding: 16, boxSizing: 'border-box' }}>
          <Outlet context={{ user, isAdmin, refreshUser, requestNavigate, registerLeaveGuard } satisfies SettingOutletContext} />
        </div>
      </div>
    </div>
  );
}

export default SettingApp;
