import { createBrowserRouter } from 'react-router';
import HomeApp from '@/apps/home';
import My115App from '@/apps/115';
import PicApp from '@/apps/pic';
import AuthApp from '@/apps/auth';
import SettingApp from '@/apps/setting';
import SettingInfoApp from '@/apps/setting/info';
import SettingUserApp from '@/apps/setting/user';
import SettingRoleApp from '@/apps/setting/role';
import SettingRoleAddApp from '@/apps/setting/role-add';
import SettingRoleEditApp from '@/apps/setting/role-edit';
import SettingUserAddApp from '@/apps/setting/user-add';
import SettingUserEditApp from '@/apps/setting/user-edit';
import SettingConfig115App from '@/apps/setting/config-115';
import RequireAuth from './require-auth';
import GuestOnly from './guest-only';
import RedirectToSetting from './redirect-to-setting';

export const router = createBrowserRouter([
  {
    path: '/auth',
    Component: GuestOnly,
    children: [{ index: true, Component: AuthApp }],
  },
  {
    path: '/',
    Component: RequireAuth,
    children: [
      { index: true, Component: HomeApp },
      {
        path: '115',
        Component: My115App,
      },
      {
        path: 'pic',
        Component: PicApp,
      },
      {
        path: 'setting',
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
          { path: 'config/115', Component: SettingConfig115App },
        ],
      },
      { path: 'admin', Component: RedirectToSetting },
    ],
  },
]);
