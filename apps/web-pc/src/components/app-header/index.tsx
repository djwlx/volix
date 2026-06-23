import { Avatar, Dropdown, Nav, Tag, Typography } from '@douyinfe/semi-ui';
import {
  IconClose,
  IconExit,
  IconMoon,
  IconSetting,
  IconSun,
  IconTick,
  IconUserAdd,
  IconUserGroup,
} from '@douyinfe/semi-icons';
import { useState, type ReactNode } from 'react';
import type { Locale } from '@volix/i18n';
import { useI18n } from '@/i18n';
import { useNavigate } from 'react-router';
import { useIsMobile, useUser } from '@/hooks';
import {
  clearAuthToken,
  getSavedAccounts,
  isAuthenticated,
  removeSavedAccount,
  setAuthToken,
  type SavedAccount,
} from '@/utils';
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
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
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
  const currentAccountId = user?.id !== undefined ? String(user.id) : undefined;

  const handleSwitchAccount = (account: SavedAccount) => {
    if (String(account.id) === currentAccountId) {
      return;
    }
    setAuthToken(account.token);
    window.location.assign('/');
  };

  const handleRemoveAccount = (event: React.MouseEvent, id: string) => {
    event.stopPropagation();
    setSavedAccounts(removeSavedAccount(id));
  };

  const defaultMenuItems: HeaderDropdownItem[] = authed
    ? [
        {
          key: 'setting',
          label: t({ id: 'header.menu.system', defaultMessage: '系统管理' }),
          icon: <IconSetting />,
          onClick: () => navigate('/setting/info'),
        },
        {
          key: 'switch-account',
          label: t({ id: 'header.menu.switchAccount', defaultMessage: '切换账号' }),
          icon: <IconUserGroup />,
          onClick: () => {},
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
  const switchAccountMenu = (
    <Dropdown.Menu>
      {savedAccounts.length === 0 ? (
        <Dropdown.Item disabled>
          {t({ id: 'header.switchAccount.empty', defaultMessage: '暂无已保存的账号' })}
        </Dropdown.Item>
      ) : (
        savedAccounts.map(account => {
          const isCurrent = String(account.id) === currentAccountId;
          const initial = account.nickname?.slice(0, 1) || account.email?.slice(0, 1)?.toUpperCase() || 'U';
          return (
            <Dropdown.Item key={account.id} active={isCurrent} onClick={() => handleSwitchAccount(account)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 220, maxWidth: 320 }}>
                <Avatar
                  size="extra-small"
                  shape="circle"
                  color="blue"
                  src={account.avatar}
                  imgAttr={{ style: { objectFit: 'cover' } }}
                  style={{ width: 24, height: 24, flex: '0 0 24px' }}
                >
                  {initial}
                </Avatar>
                <Typography.Text ellipsis={{ showTooltip: true }} style={{ flex: 1, minWidth: 0 }}>
                  {account.nickname ? `${account.nickname} (${account.email})` : account.email}
                </Typography.Text>
                {isCurrent ? (
                  <IconTick style={{ color: 'var(--semi-color-primary)', flexShrink: 0 }} />
                ) : (
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label={t({ id: 'header.switchAccount.remove', defaultMessage: '移除账号' })}
                    onClick={event => handleRemoveAccount(event, account.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      color: 'var(--semi-color-text-2)',
                      flexShrink: 0,
                    }}
                  >
                    <IconClose size="small" />
                  </span>
                )}
              </div>
            </Dropdown.Item>
          );
        })
      )}
      <Dropdown.Divider />
      <Dropdown.Item icon={<IconUserAdd />} onClick={() => navigate('/auth')}>
        {t({ id: 'header.switchAccount.add', defaultMessage: '添加账号' })}
      </Dropdown.Item>
    </Dropdown.Menu>
  );
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
        {dropdownItems.map(item =>
          item.key === 'switch-account' ? (
            <Dropdown
              key={item.key}
              trigger={isMobile ? 'click' : 'hover'}
              position={isMobile ? 'bottomLeft' : 'leftTop'}
              getPopupContainer={() => document.body}
              render={switchAccountMenu}
            >
              <Dropdown.Item icon={item.icon}>{item.label}</Dropdown.Item>
            </Dropdown>
          ) : (
            <Dropdown.Item key={item.key} icon={item.icon} type={item.type} onClick={item.onClick}>
              {item.label}
            </Dropdown.Item>
          )
        )}
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
          <Dropdown
            trigger="click"
            position="bottomRight"
            render={dropdownContent}
            onVisibleChange={visible => {
              if (visible) {
                setSavedAccounts(getSavedAccounts());
              }
            }}
          >
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
