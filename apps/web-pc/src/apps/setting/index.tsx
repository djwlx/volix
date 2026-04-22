import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Nav, SideSheet, Toast } from '@douyinfe/semi-ui';
import {
  IconActivity,
  IconBolt,
  IconCloudStroked,
  IconConfigStroked,
  IconDesktop,
  IconLayers,
  IconMailStroked,
  IconMenu,
  IconShield,
  IconUserList,
} from '@douyinfe/semi-icons';
import { IconAvatar } from '@douyinfe/semi-icons-lab';
import { useLocation, Outlet } from 'react-router';
import { useAppPageContext } from '@/hooks';
import type { ReactNode } from 'react';
import styles from './index.module.scss';

const COMPACT_LAYOUT_QUERY = '(max-width: 1100px)';

const getCompactLayout = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia(COMPACT_LAYOUT_QUERY).matches;
};

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
  const location = useLocation();
  const [isCompactLayout, setIsCompactLayout] = useState(getCompactLayout);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const { isAdmin, requestNavigate } = useAppPageContext();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(COMPACT_LAYOUT_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsCompactLayout(event.matches);
    };

    setIsCompactLayout(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
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
    if (location.pathname.startsWith('/setting/config/ai')) {
      return 'config/ai';
    }
    if (location.pathname.startsWith('/setting/config/bangumi')) {
      return 'config/bangumi';
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
                    itemKey: 'config/ai',
                    text: 'AI',
                    icon: (
                      <MenuIcon
                        icon={<IconBolt />}
                        bg="linear-gradient(135deg, rgba(14, 165, 233, 0.18) 0%, rgba(2, 132, 199, 0.22) 100%)"
                        color="#0369a1"
                      />
                    ),
                  },
                  {
                    itemKey: 'config/bangumi',
                    text: 'Bangumi',
                    icon: (
                      <MenuIcon
                        icon={<IconActivity />}
                        bg="linear-gradient(135deg, rgba(236, 72, 153, 0.16) 0%, rgba(244, 63, 94, 0.22) 100%)"
                        color="#be185d"
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

  return (
    <div className={styles.page}>
      {isCompactLayout ? (
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
        {!isCompactLayout ? (
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
        <div className={`${styles.content} ${isCompactLayout ? styles.contentMobile : ''}`}>
          {isCompactLayout ? (
            <div className={styles.mobileActionBar}>
              <Button icon={<IconMenu />} onClick={() => setMobileNavVisible(true)}>
                菜单
              </Button>
            </div>
          ) : null}
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default SettingApp;
