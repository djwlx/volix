import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Nav, SideSheet, Toast } from '@douyinfe/semi-ui';
import {
  IconBolt,
  IconCloudStroked,
  IconConfigStroked,
  IconDesktop,
  IconExit,
  IconLayers,
  IconMailStroked,
  IconMenu,
  IconShield,
  IconUserList,
} from '@douyinfe/semi-icons';
import { IconAvatar } from '@douyinfe/semi-icons-lab';
import { clearAuthToken, getHttpErrorMessage, isAuthError } from '@/utils';
import { useLocation, useNavigate, Outlet } from 'react-router';
import { getCurrentUser } from '@/services/user';
import { UserRole } from '@volix/types';
import type { UserInfoResponse } from '@volix/types';
import { AppHeader, Loading } from '@/components';
import { useIsMobile } from '@/hooks';
import type { SettingOutletContext } from './types';
import type { ReactNode } from 'react';
import styles from './index.module.scss';
import adminIcon from '@/assets/icons/admin.svg';

function MenuIcon(props: { icon: ReactNode; bg: string; color: string }) {
  const { icon, bg, color } = props;

  return (
    <span
      style={{
        width: 30,
        height: 30,
        borderRadius: 11,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        color,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
    >
      {icon}
    </span>
  );
}

function SettingApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<UserInfoResponse>();
  const [userLoading, setUserLoading] = useState(true);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
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

  const requestNavigate = useCallback(
    (to: string) => {
      if (leaveGuardRef.current && !leaveGuardRef.current()) {
        return;
      }
      navigate(to);
    },
    [navigate]
  );

  const registerLeaveGuard = useCallback((guard: (() => boolean) | null) => {
    leaveGuardRef.current = guard;
  }, []);

  const handleNavSelect = useCallback(
    (key: string) => {
      if (key === 'config') {
        return;
      }
      if (key === 'user' && !isAdmin) {
        Toast.warning('仅管理员可访问用户信息');
        return;
      }
      requestNavigate(`/setting/${key}`);
      setMobileNavVisible(false);
    },
    [isAdmin, requestNavigate]
  );

  useEffect(() => {
    setUserLoading(true);
    refreshUser()
      .catch(error => {
        if (isAuthError(error)) {
          onLogout();
          return;
        }
        Toast.error(getHttpErrorMessage(error, '获取用户信息失败，请稍后重试'));
      })
      .finally(() => {
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
      text: '基础设置',
      items: [
        {
          itemKey: 'info',
          text: '个人信息',
          icon: (
            <MenuIcon
              icon={<IconAvatar />}
              bg="linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(59, 130, 246, 0.22) 100%)"
              color="#2563eb"
            />
          ),
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
                icon: (
                  <MenuIcon
                    icon={<IconUserList />}
                    bg="linear-gradient(135deg, rgba(45, 212, 191, 0.18) 0%, rgba(20, 184, 166, 0.22) 100%)"
                    color="#0f766e"
                  />
                ),
              },
              {
                itemKey: 'role',
                text: '角色管理',
                icon: (
                  <MenuIcon
                    icon={<IconShield />}
                    bg="linear-gradient(135deg, rgba(251, 191, 36, 0.18) 0%, rgba(249, 115, 22, 0.22) 100%)"
                    color="#c2410c"
                  />
                ),
              },
              {
                itemKey: 'system',
                text: '系统配置',
                icon: (
                  <MenuIcon
                    icon={<IconDesktop />}
                    bg="linear-gradient(135deg, rgba(129, 140, 248, 0.18) 0%, rgba(99, 102, 241, 0.22) 100%)"
                    color="#4f46e5"
                  />
                ),
              },
              {
                itemKey: 'config',
                text: '账号配置',
                icon: (
                  <MenuIcon
                    icon={<IconConfigStroked />}
                    bg="linear-gradient(135deg, rgba(244, 114, 182, 0.16) 0%, rgba(236, 72, 153, 0.2) 100%)"
                    color="#db2777"
                  />
                ),
                items: [
                  {
                    itemKey: 'config/115',
                    text: '115',
                    icon: (
                      <MenuIcon
                        icon={<IconCloudStroked />}
                        bg="linear-gradient(135deg, rgba(34, 197, 94, 0.16) 0%, rgba(22, 163, 74, 0.22) 100%)"
                        color="#15803d"
                      />
                    ),
                  },
                  {
                    itemKey: 'config/qbittorrent',
                    text: 'qBittorrent',
                    icon: (
                      <MenuIcon
                        icon={<IconBolt />}
                        bg="linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(37, 99, 235, 0.22) 100%)"
                        color="#1d4ed8"
                      />
                    ),
                  },
                  {
                    itemKey: 'config/openlist',
                    text: 'OpenList',
                    icon: (
                      <MenuIcon
                        icon={<IconLayers />}
                        bg="linear-gradient(135deg, rgba(168, 85, 247, 0.18) 0%, rgba(147, 51, 234, 0.22) 100%)"
                        color="#7e22ce"
                      />
                    ),
                  },
                  {
                    itemKey: 'config/smtp',
                    text: 'SMTP',
                    icon: (
                      <MenuIcon
                        icon={<IconMailStroked />}
                        bg="linear-gradient(135deg, rgba(251, 146, 60, 0.18) 0%, rgba(249, 115, 22, 0.22) 100%)"
                        color="#c2410c"
                      />
                    ),
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
    <div className={styles.page}>
      <AppHeader
        title="后台管理"
        logo={<img alt="后台管理" src={adminIcon} style={{ display: 'block', width: 44, height: 44 }} />}
        onLogoClick={() => requestNavigate('/')}
        beforeLogo={
          isMobile ? (
            <Button
              icon={<IconMenu />}
              theme="borderless"
              aria-label="打开菜单"
              onClick={() => setMobileNavVisible(true)}
            />
          ) : null
        }
        userOverride={user}
        showUserName={!isMobile}
        userBadge={isAdmin ? '管理员' : '普通用户'}
        menuItems={[{ key: 'logout', label: '退出登录', icon: <IconExit />, type: 'danger', onClick: onLogout }]}
      />

      {isMobile ? (
        <SideSheet
          title="菜单"
          visible={mobileNavVisible}
          onCancel={() => setMobileNavVisible(false)}
          placement="left"
          width={280}
          bodyStyle={{ padding: 0 }}
        >
          <Nav
            mode="vertical"
            className={styles.settingNav}
            style={{ width: '100%' }}
            bodyStyle={{ paddingTop: 8 }}
            items={navItems}
            selectedKeys={[activeKey]}
            defaultOpenKeys={isAdmin ? ['common-settings', 'admin-settings', 'config'] : ['common-settings']}
            onSelect={data => {
              handleNavSelect(data.itemKey as string);
            }}
          />
        </SideSheet>
      ) : null}

      <div className={styles.shell}>
        {!isMobile ? (
          <Nav
            mode="vertical"
            className={`${styles.settingNav} ${styles.sidebar}`}
            style={{
              width: 280,
            }}
            bodyStyle={{ paddingTop: 8 }}
            items={navItems}
            selectedKeys={[activeKey]}
            defaultOpenKeys={isAdmin ? ['common-settings', 'admin-settings', 'config'] : ['common-settings']}
            onSelect={data => {
              handleNavSelect(data.itemKey as string);
            }}
          />
        ) : null}
        <div className={`${styles.content} ${isMobile ? styles.contentMobile : ''}`}>
          <Outlet
            context={{ user, isAdmin, refreshUser, requestNavigate, registerLeaveGuard } satisfies SettingOutletContext}
          />
        </div>
      </div>
    </div>
  );
}

export default SettingApp;
