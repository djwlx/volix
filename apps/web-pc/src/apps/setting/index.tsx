import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Nav, SideSheet, Toast } from '@douyinfe/semi-ui';
import { IconCloudStroked, IconConfigStroked, IconDesktop, IconMenu, IconUserList } from '@douyinfe/semi-icons';
import { IconAvatar } from '@douyinfe/semi-icons-lab';
import { useLocation, Outlet } from 'react-router';
import { useI18n } from '@/i18n';
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
  const { t } = useI18n();
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
        Toast.warning(t({ id: 'setting.user.adminOnly', defaultMessage: '仅管理员可访问用户信息' }));
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
    if (location.pathname.startsWith('/setting/config/rsshub')) {
      return 'config/rsshub';
    }
    if (location.pathname.startsWith('/setting/config/account')) {
      return 'config/account';
    }
    if (location.pathname.startsWith('/setting/system')) {
      return 'system';
    }
    if (location.pathname.startsWith('/setting/user')) {
      return 'user';
    }
    return 'info';
  }, [location.pathname]);

  const navItems = [
    {
      itemKey: 'common-settings',
      text: t({ id: 'setting.nav.common', defaultMessage: '基础设置' }),
      items: [
        {
          itemKey: 'info',
          text: t({ id: 'setting.nav.info', defaultMessage: '个人信息' }),
          icon: (
            <MenuIcon
              icon={<IconAvatar />}
              bg="linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(59, 130, 246, 0.22) 100%)"
              color="#2563eb"
            />
          ),
        },
        {
          itemKey: 'config/rsshub',
          text: t({ id: 'setting.nav.rss', defaultMessage: 'RSS 配置' }),
          icon: (
            <MenuIcon
              icon={<IconCloudStroked />}
              bg="linear-gradient(135deg, rgba(14, 165, 233, 0.18) 0%, rgba(20, 184, 166, 0.22) 100%)"
              color="#0f766e"
            />
          ),
        },
        {
          itemKey: 'config/account',
          text: t({ id: 'setting.nav.account', defaultMessage: '账号管理' }),
          icon: (
            <MenuIcon
              icon={<IconConfigStroked />}
              bg="linear-gradient(135deg, rgba(244, 114, 182, 0.16) 0%, rgba(236, 72, 153, 0.2) 100%)"
              color="#db2777"
            />
          ),
        },
        {
          itemKey: 'config/115',
          text: t({ id: 'setting.nav.pic', defaultMessage: '随机图片配置' }),
          icon: (
            <MenuIcon
              icon={<IconCloudStroked />}
              bg="linear-gradient(135deg, rgba(34, 197, 94, 0.16) 0%, rgba(22, 163, 74, 0.22) 100%)"
              color="#15803d"
            />
          ),
        },
      ],
    },
    ...(isAdmin
      ? [
          {
            itemKey: 'admin-settings',
            text: t({ id: 'setting.nav.admin', defaultMessage: '管理员设置' }),
            items: [
              {
                itemKey: 'user',
                text: t({ id: 'setting.nav.user', defaultMessage: '用户管理' }),
                icon: (
                  <MenuIcon
                    icon={<IconUserList />}
                    bg="linear-gradient(135deg, rgba(45, 212, 191, 0.18) 0%, rgba(20, 184, 166, 0.22) 100%)"
                    color="#0f766e"
                  />
                ),
              },
              {
                itemKey: 'system',
                text: t({ id: 'setting.nav.system', defaultMessage: '系统配置' }),
                icon: (
                  <MenuIcon
                    icon={<IconDesktop />}
                    bg="linear-gradient(135deg, rgba(129, 140, 248, 0.18) 0%, rgba(99, 102, 241, 0.22) 100%)"
                    color="#4f46e5"
                  />
                ),
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
          title={t({ id: 'setting.nav.menu', defaultMessage: '菜单' })}
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
            defaultOpenKeys={isAdmin ? ['common-settings', 'admin-settings'] : ['common-settings']}
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
            defaultOpenKeys={isAdmin ? ['common-settings', 'admin-settings'] : ['common-settings']}
            onSelect={data => {
              handleNavSelect(data.itemKey as string);
            }}
          />
        ) : null}
        <div className={`${styles.content} ${isCompactLayout ? styles.contentMobile : ''}`}>
          {isCompactLayout ? (
            <div className={styles.mobileActionBar}>
              <Button icon={<IconMenu />} onClick={() => setMobileNavVisible(true)}>
                {t({ id: 'setting.nav.menu', defaultMessage: '菜单' })}
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
