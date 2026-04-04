import { createBrowserRouter } from 'react-router';
import HomeApp from '@/apps/home';
import My115App from '@/apps/115';
import PicApp from '@/apps/pic';
import AuthApp from '@/apps/auth';
import SettingApp from '@/apps/setting';
import SettingInfoApp from '@/apps/setting/pages/info';
import SettingUserApp from '@/apps/setting/pages/user';
import SettingRoleApp from '@/apps/setting/pages/role';
import SettingRoleAddApp from '@/apps/setting/pages/role/add';
import SettingRoleEditApp from '@/apps/setting/pages/role/edit';
import SettingUserAddApp from '@/apps/setting/pages/user/add';
import SettingUserEditApp from '@/apps/setting/pages/user/edit';
import SettingConfig115App from '@/apps/setting/pages/config/config-115';
import SettingConfigQbittorrentApp from '@/apps/setting/pages/config/config-qbittorrent';
import SettingConfigOpenlistApp from '@/apps/setting/pages/config/config-openlist';
import SettingConfigSmtpApp from '@/apps/setting/pages/config/config-smtp';
import SettingSystemApp from '@/apps/setting/pages/system';
import RequireAuth from './require-auth';
import GuestOnly from './guest-only';
import GuestAllowed from './guest-allowed';
import RedirectToSetting from './redirect-to-setting';
import AppErrorBoundary from './error-boundary';
import { AppFeature } from '@volix/types';
import withFeatureRequired from './with-feature-required';

export const router = createBrowserRouter([
  {
    path: '/auth',
    Component: GuestOnly,
    ErrorBoundary: AppErrorBoundary,
    children: [{ index: true, Component: AuthApp }],
  },
  {
    path: '/pic',
    Component: GuestAllowed,
    ErrorBoundary: AppErrorBoundary,
    children: [{ index: true, Component: PicApp }],
  },
  {
    path: '/',
    Component: RequireAuth,
    ErrorBoundary: AppErrorBoundary,
    children: [
      { index: true, Component: HomeApp },
      {
        path: '115',
        Component: withFeatureRequired(My115App, [AppFeature.ACCOUNT_115]),
      },
      {
        path: 'setting',
        Component: withFeatureRequired(SettingApp, [AppFeature.ACCOUNT_115, AppFeature.RANDOM_PIC]),
        children: [
          { index: true, Component: RedirectToSetting },
          { path: 'info', Component: SettingInfoApp },
          { path: 'user', Component: SettingUserApp },
          { path: 'user/add', Component: SettingUserAddApp },
          { path: 'user/edit/:id', Component: SettingUserEditApp },
          { path: 'role', Component: SettingRoleApp },
          { path: 'role/add', Component: SettingRoleAddApp },
          { path: 'role/edit/:roleKey', Component: SettingRoleEditApp },
          { path: 'system', Component: SettingSystemApp },
          { path: 'config/115', Component: SettingConfig115App },
          { path: 'config/qbittorrent', Component: SettingConfigQbittorrentApp },
          { path: 'config/openlist', Component: SettingConfigOpenlistApp },
          { path: 'config/smtp', Component: SettingConfigSmtpApp },
        ],
      },
      { path: 'admin', Component: RedirectToSetting },
    ],
  },
]);
