import { createBrowserRouter } from 'react-router';
import HomeApp from '@/apps/home';
import ColorPickerApp from '@/apps/color-picker';
import FormatterApp from '@/apps/formatter';
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
import SettingConfigAiApp from '@/apps/setting/pages/config/config-ai';
import SettingAnimeSubscriptionApp from '@/apps/setting/pages/anime-subscription';
import SettingAnimeSubscriptionAddApp from '@/apps/setting/pages/anime-subscription/add';
import SettingAnimeSubscriptionEditApp from '@/apps/setting/pages/anime-subscription/edit';
import SettingOpenlistAiOrganizerApp from '@/apps/setting/pages/openlist-ai-organizer';
import SettingSystemApp from '@/apps/setting/pages/system';
import RedirectToSetting from './redirect-to-setting';
import AppErrorBoundary from './error-boundary';
import { GuestOnlyRoute, RequireAuthRoute } from './route-access';

export const router = createBrowserRouter([
  {
    path: '/auth',
    Component: GuestOnlyRoute,
    ErrorBoundary: AppErrorBoundary,
    children: [{ index: true, Component: AuthApp }],
  },
  {
    path: '/formatter',
    ErrorBoundary: AppErrorBoundary,
    children: [{ index: true, Component: FormatterApp }],
  },
  {
    path: '/color-picker',
    ErrorBoundary: AppErrorBoundary,
    children: [{ index: true, Component: ColorPickerApp }],
  },
  {
    path: '/pic',
    ErrorBoundary: AppErrorBoundary,
    children: [{ index: true, Component: PicApp }],
  },
  {
    path: '/',
    ErrorBoundary: AppErrorBoundary,
    children: [
      { index: true, Component: HomeApp },
      {
        path: 'setting',
        Component: RequireAuthRoute,
        children: [
          {
            Component: SettingApp,
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
              { path: 'anime-subscription', Component: SettingAnimeSubscriptionApp },
              { path: 'anime-subscription/add', Component: SettingAnimeSubscriptionAddApp },
              { path: 'anime-subscription/edit/:id', Component: SettingAnimeSubscriptionEditApp },
              { path: 'openlist-ai-organizer', Component: SettingOpenlistAiOrganizerApp },
              { path: 'config/115', Component: SettingConfig115App },
              { path: 'config/ai', Component: SettingConfigAiApp },
              { path: 'config/qbittorrent', Component: SettingConfigQbittorrentApp },
              { path: 'config/openlist', Component: SettingConfigOpenlistApp },
              { path: 'config/smtp', Component: SettingConfigSmtpApp },
            ],
          },
        ],
      },
      { path: 'admin', Component: RedirectToSetting },
    ],
  },
]);
