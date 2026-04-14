import { Avatar, Dropdown, Nav, Switch, Tag, Typography } from '@douyinfe/semi-ui';
import { IconMoon, IconSetting, IconSun } from '@douyinfe/semi-icons';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useUser } from '@/hooks';
import { isAuthenticated } from '@/utils';
import { useGlobalConfigStore } from '@/stores';
import { setAppTheme } from '@/utils/theme';
import styles from './index.module.scss';

interface HeaderMenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  type?: 'danger' | 'primary' | 'secondary' | 'tertiary' | 'warning';
  onClick: () => void;
}

interface AppHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  logo: ReactNode;
  onLogoClick?: () => void;
  beforeLogo?: ReactNode;
  menuItems?: HeaderMenuItem[];
  showUserName?: boolean;
  userBadge?: ReactNode;
  userOverride?: {
    avatar?: string;
    nickname?: string;
    email?: string;
  };
}

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
  const { user } = useUser(false);
  const authed = isAuthenticated();
  const theme = useGlobalConfigStore(state => state.config.theme);

  const currentUser = userOverride || user;
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
      <div
        onClick={event => event.stopPropagation()}
        style={{
          padding: 12,
          borderBottom: '1px solid var(--semi-color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconSun size="small" style={{ color: 'var(--app-text-muted)' }} />
          <Switch checked={theme === 'dark'} onChange={checked => setAppTheme(checked ? 'dark' : 'light')} />
          <IconMoon size="small" style={{ color: 'var(--app-text-muted)' }} />
        </div>
      </div>
      <Dropdown.Menu>
        {menuItems.map(item => (
          <Dropdown.Item key={item.key} icon={item.icon} type={item.type} onClick={item.onClick}>
            {item.label}
          </Dropdown.Item>
        ))}
        {!authed ? (
          <Dropdown.Item icon={<IconSetting />} onClick={() => navigate('/auth')}>
            去登录
          </Dropdown.Item>
        ) : null}
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
                <div className={styles.titleText}>{title}</div>
                <Typography.Text className={styles.description} ellipsis={{ showTooltip: true }}>
                  {description}
                </Typography.Text>
              </div>
            ) : (
              <div className={styles.titleText}>{title}</div>
            )}
          </div>
        ),
      }}
      footer={
        <Dropdown trigger="click" position="bottomRight" render={dropdownContent}>
          {authed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', minWidth: 0 }}>
              <Avatar
                size="32px"
                shape="circle"
                color="blue"
                src={currentUser?.avatar}
                imgAttr={{ style: { objectFit: 'cover' } }}
                style={{ flex: '0 0 32px' }}
              >
                {currentUser?.nickname?.slice(0, 1) || currentUser?.email?.slice(0, 1)?.toUpperCase() || 'U'}
              </Avatar>
              {showUserName ? (
                <Typography.Text ellipsis style={{ minWidth: 0 }}>
                  {currentUser?.nickname || currentUser?.email || '未登录'}
                </Typography.Text>
              ) : null}
              {userBadge ? <Tag style={{ flexShrink: 0 }}>{userBadge}</Tag> : null}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', minWidth: 0 }}>
              <Avatar size="32px" shape="circle" color="grey" style={{ flex: '0 0 32px' }}>
                U
              </Avatar>
              {showUserName ? <Typography.Text style={{ minWidth: 0 }}>未登录</Typography.Text> : null}
            </div>
          )}
        </Dropdown>
      }
    />
  );
}
