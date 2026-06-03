import { Avatar, Dropdown, Nav, Tag, Typography } from '@douyinfe/semi-ui';
import { IconExit, IconMoon, IconSetting, IconSun } from '@douyinfe/semi-icons';
import type { ReactNode } from 'react';
import type { Locale } from '@volix/i18n';
import { useI18n } from '@/i18n';
import { useNavigate } from 'react-router';
import { useIsMobile, useUser } from '@/hooks';
import { clearAuthToken, isAuthenticated } from '@/utils';
import { useGlobalConfigStore } from '@/stores';
import { setAppTheme } from '@/utils/theme';
import { buildHeaderDropdownItems, type HeaderDropdownItem } from './menu-items';
import styles from './index.module.scss';

interface AppHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  logo: ReactNode;
  onLogoClick?: () => void;
  beforeLogo?: ReactNode;
  menuItems?: HeaderDropdownItem[];
  showUserName?: boolean;
  userBadge?: ReactNode;
  userOverride?: {
    avatar?: string;
    nickname?: string;
    email?: string;
  };
}

const getNextLocale = (locale: Locale): Locale => {
  return locale === 'zh-CN' ? 'en-US' : 'zh-CN';
};

export function AppHeader(props: AppHeaderProps) {
  const {
    title,
    description,
    logo,
    onLogoClick,
    beforeLogo,
    menuItems = [],
    showUserName = true,
    userBadge,
    userOverride,
  } = props;
  const navigate = useNavigate();
  const { locale, setLocale, t } = useI18n();
  const { user } = useUser(false);
  const isMobile = useIsMobile();
  const authed = isAuthenticated();
  const theme = useGlobalConfigStore(state => state.config.theme);
  const nextLocale = getNextLocale(locale);
  const localeOptions: Array<{ value: Locale; label: string }> = [
    { value: 'zh-CN', label: t('header.locale.zhCn') },
    { value: 'en-US', label: t('header.locale.enUs') },
  ];
  const currentLocaleLabel = localeOptions.find(item => item.value === locale)?.label || locale;
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  const currentUser = userOverride || user;
  const defaultMenuItems: HeaderDropdownItem[] = authed
    ? [
        {
          key: 'setting',
          label: t({ id: 'header.menu.system', defaultMessage: '系统管理' }),
          icon: <IconSetting />,
          onClick: () => navigate('/setting/info'),
        },
        {
          key: 'logout',
          label: t({ id: 'header.menu.logout', defaultMessage: '退出登录' }),
          icon: <IconExit />,
          type: 'danger',
          onClick: () => {
            clearAuthToken();
            navigate('/', { replace: true });
          },
        },
      ]
    : [];
  const resolvedMenuItems = menuItems.length > 0 ? menuItems : defaultMenuItems;
  const localeMenuItem: HeaderDropdownItem = {
    key: 'locale',
    label: t(nextLocale === 'zh-CN' ? 'header.locale.switchToZhCn' : 'header.locale.switchToEnUs'),
    onClick: () => setLocale(nextLocale),
  };
  const themeMenuItem: HeaderDropdownItem = {
    key: 'theme',
    label: t(theme === 'dark' ? 'header.theme.switchToLight' : 'header.theme.switchToDark'),
    icon: theme === 'dark' ? <IconSun /> : <IconMoon />,
    onClick: () => setAppTheme(nextTheme),
  };
  const loginMenuItem: HeaderDropdownItem = {
    key: 'login',
    label: t({ id: 'header.menu.login', defaultMessage: '去登录' }),
    icon: <IconSetting />,
    onClick: () => navigate('/auth'),
  };
  const dropdownItems = buildHeaderDropdownItems({
    isMobile,
    authed,
    menuItems: resolvedMenuItems,
    localeItem: localeMenuItem,
    themeItem: themeMenuItem,
    loginItem: loginMenuItem,
  });
  const dropdownContent = (
    <div
      style={{
        minWidth: 240,
        borderRadius: 14,
        overflow: 'hidden',
        background: 'var(--semi-color-bg-2)',
        border: '1px solid var(--semi-color-border)',
        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.16)',
      }}
    >
      <Dropdown.Menu>
        {dropdownItems.map(item => (
          <Dropdown.Item key={item.key} icon={item.icon} type={item.type} onClick={item.onClick}>
            {item.label}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </div>
  );

  return (
    <Nav
      className={styles.nav}
      mode="horizontal"
      header={{
        logo: (
          <div className={styles.brand}>
            {beforeLogo}
            <div onClick={onLogoClick} className={onLogoClick ? styles.logoButton : styles.logoStatic}>
              {logo}
            </div>
            {description ? (
              <div className={styles.titleWrap}>
                <Typography.Text className={styles.titleText} title={String(title ?? '')}>
                  {title}
                </Typography.Text>
                <Typography.Text className={styles.description} title={String(description ?? '')}>
                  {description}
                </Typography.Text>
              </div>
            ) : (
              <Typography.Text className={styles.titleText} title={String(title ?? '')}>
                {title}
              </Typography.Text>
            )}
          </div>
        ),
      }}
      footer={
        <div className={styles.headerTools}>
          {!isMobile ? (
            <>
              <button
                type="button"
                className={styles.localeButton}
                title={currentLocaleLabel}
                aria-label={t(nextLocale === 'zh-CN' ? 'header.locale.switchToZhCn' : 'header.locale.switchToEnUs')}
                onClick={() => setLocale(nextLocale)}
              >
                <span className={styles.localeGlyph} aria-hidden="true">
                  <span className={styles.localeGlyphLatin}>A</span>
                  <span className={styles.localeGlyphCjk}>文</span>
                </span>
              </button>
              <button
                type="button"
                className={`${styles.themeToggle} ${theme === 'dark' ? styles.themeToggleDark : ''}`}
                title={t(theme === 'dark' ? 'header.theme.currentDark' : 'header.theme.currentLight')}
                aria-label={t(theme === 'dark' ? 'header.theme.switchToLight' : 'header.theme.switchToDark')}
                onClick={() => setAppTheme(nextTheme)}
              >
                <span className={styles.themeTrackIcon}>
                  {theme === 'dark' ? <IconMoon size="small" /> : <IconSun size="small" />}
                </span>
              </button>
            </>
          ) : null}
          <Dropdown trigger="click" position="bottomRight" render={dropdownContent}>
            {authed ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', minWidth: 0 }}>
                <Avatar
                  size="small"
                  shape="circle"
                  color="blue"
                  src={currentUser?.avatar}
                  imgAttr={{ style: { objectFit: 'cover' } }}
                  style={{ width: 32, height: 32, flex: '0 0 32px' }}
                >
                  {currentUser?.nickname?.slice(0, 1) || currentUser?.email?.slice(0, 1)?.toUpperCase() || 'U'}
                </Avatar>
                {showUserName ? (
                  <Typography.Text
                    style={{ minWidth: 0 }}
                    className={styles.userName}
                    title={
                      currentUser?.nickname ||
                      currentUser?.email ||
                      t({ id: 'header.user.guest', defaultMessage: '未登录' })
                    }
                  >
                    {currentUser?.nickname ||
                      currentUser?.email ||
                      t({ id: 'header.user.guest', defaultMessage: '未登录' })}
                  </Typography.Text>
                ) : null}
                {userBadge ? <Tag style={{ flexShrink: 0 }}>{userBadge}</Tag> : null}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', minWidth: 0 }}>
                <Avatar size="small" shape="circle" color="grey" style={{ width: 32, height: 32, flex: '0 0 32px' }}>
                  U
                </Avatar>
                {showUserName ? (
                  <Typography.Text
                    style={{ minWidth: 0 }}
                    className={styles.userName}
                    title={t({ id: 'header.user.guest', defaultMessage: '未登录' })}
                  >
                    {t({ id: 'header.user.guest', defaultMessage: '未登录' })}
                  </Typography.Text>
                ) : null}
              </div>
            )}
          </Dropdown>
        </div>
      }
    />
  );
}
