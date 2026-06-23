import { createBrowserRouter } from 'react-router';
import {
  IconApps,
  IconArticle,
  IconCloudStroked,
  IconComment,
  IconMailStroked,
  IconStar,
  IconTabsStroked,
} from '@douyinfe/semi-icons';
import HomeApp from '@/apps/home';
import SqliteAdminApp from '@/apps/sqlite-admin';
import LogViewerApp from '@/apps/log-viewer';
import ColorPickerApp from '@/apps/color-picker';
import FormatterApp from '@/apps/formatter';
import AiTranslateApp from '@/apps/ai-translate';
import PicApp from '@/apps/pic';
import PicLikedApp from '@/apps/pic-liked';
import RssApp from '@/apps/rss';
import AuthApp from '@/apps/auth';
import SettingApp from '@/apps/setting';
import FormatConvertApp from '@/apps/format-convert';
import SettingInfoApp from '@/apps/setting/pages/info';
import SettingUserApp from '@/apps/setting/pages/user';
import SettingUserAddApp from '@/apps/setting/pages/user/add';
import SettingUserEditApp from '@/apps/setting/pages/user/edit';
import SettingConfig115App from '@/apps/setting/pages/config/config-115';
import SettingConfigRsshubApp from '@/apps/setting/pages/config/config-rsshub';
import SettingConfigAccountCenterApp from '@/apps/setting/pages/config/config-account-center';
import SettingSystemApp from '@/apps/setting/pages/system';
import RedirectToSetting from './redirect-to-setting';
import AppErrorBoundary from './error-boundary';
import AppShell, { type AppRouteHandle } from './app-shell';
import formatterIcon from '@/assets/icons/formatter.svg';
import colorPickerIcon from '@/assets/icons/color-picker.svg';
import adminIcon from '@/assets/icons/admin.svg';

const logoWrapStyle = {
  width: 40,
  height: 40,
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontWeight: 800,
} as const;

const routeHandle = (config: AppRouteHandle): AppRouteHandle => config;
const msg = (id: string, defaultMessage: string) => ({ id, defaultMessage });

export const router = createBrowserRouter([
  {
    path: '/auth',
    Component: AuthApp,
    ErrorBoundary: AppErrorBoundary,
  },
  {
    path: '/',
    Component: AppShell,
    ErrorBoundary: AppErrorBoundary,
    handle: routeHandle({
      appHeader: {
        title: msg('route.home.title', '我的应用'),
        logo: (
          <div style={{ ...logoWrapStyle, background: 'linear-gradient(135deg, #14B8A6 0%, #22C55E 100%)' }}>
            <IconApps style={{ fontSize: 20 }} />
          </div>
        ),
      },
    }),
    children: [
      { index: true, Component: HomeApp },
      {
        path: 'sqlite-admin',
        Component: SqliteAdminApp,
        handle: routeHandle({
          requiresAuth: true,
          appHeader: {
            title: msg('route.sqliteAdmin.title', 'SQLite 数据管理'),
            description: msg('route.sqliteAdmin.description', '管理员可直接浏览和编辑当前应用数据库中的表数据'),
            logo: (
              <div style={{ ...logoWrapStyle, background: 'linear-gradient(135deg, #020617 0%, #0369a1 100%)' }}>
                <IconTabsStroked style={{ fontSize: 20 }} />
              </div>
            ),
          },
        }),
      },
      {
        path: 'log-viewer',
        Component: LogViewerApp,
        handle: routeHandle({
          requiresAuth: true,
          appHeader: {
            title: msg('route.logViewer.title', '运行日志'),
            description: msg('route.logViewer.description', '管理员可查看普通日志与数据库日志，按级别过滤和搜索'),
            logo: (
              <div style={{ ...logoWrapStyle, background: 'linear-gradient(135deg, #1e293b 0%, #4f46e5 100%)' }}>
                <IconArticle style={{ fontSize: 20 }} />
              </div>
            ),
          },
        }),
      },
      {
        path: 'formatter',
        Component: FormatterApp,
        handle: routeHandle({
          contentSpacing: 'flush',
          appHeader: {
            title: msg('route.formatter.title', '智能格式化'),
            description: msg('route.formatter.description', '支持 JSON、XML、Base64 的智能识别、递归解码和结构化查看'),
            logo: <img alt="Formatter" src={formatterIcon} style={{ display: 'block', width: 44, height: 44 }} />,
          },
        }),
      },
      {
        path: 'color-picker',
        Component: ColorPickerApp,
        handle: routeHandle({
          appHeader: {
            title: msg('route.colorPicker.title', '取色器'),
            description: msg('route.colorPicker.description', '支持网页取色和图片点击取色，自动生成 HEX、RGB、HSL'),
            logo: <img alt="Color Picker" src={colorPickerIcon} style={{ display: 'block', width: 44, height: 44 }} />,
          },
        }),
      },
      {
        path: 'ai-translate',
        Component: AiTranslateApp,
        handle: routeHandle({
          requiresAuth: true,
          appHeader: {
            title: msg('route.aiTranslate.title', 'AI 翻译'),
            description: msg('route.aiTranslate.description', '使用当前账号下的 AI 配置完成单段文本翻译'),
            logo: (
              <div style={{ ...logoWrapStyle, background: 'linear-gradient(135deg, #0f766e 0%, #16a34a 100%)' }}>
                AI
              </div>
            ),
          },
        }),
      },
      {
        path: 'pic',
        Component: PicApp,
        handle: routeHandle({
          appHeader: null,
          contentSpacing: 'flush',
        }),
      },
      {
        path: 'pic/likes',
        Component: PicLikedApp,
        handle: routeHandle({
          requiresAuth: true,
          appHeader: {
            title: msg('route.picLikes.title', '我的喜欢'),
            description: msg('route.picLikes.description', '管理你收藏的 115 图片'),
            logo: (
              <div style={{ ...logoWrapStyle, background: 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)' }}>
                <IconStar style={{ fontSize: 20 }} />
              </div>
            ),
          },
        }),
      },
      {
        path: 'rss',
        Component: RssApp,
        handle: routeHandle({
          appHeader: {
            title: msg('route.rss.title', 'RSS 阅读器'),
            description: msg('route.rss.description', '基于 RSSHub 的订阅抓取与阅读'),
            logo: (
              <div style={{ ...logoWrapStyle, background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)' }}>
                RSS
              </div>
            ),
          },
        }),
      },
      {
        path: 'format-convert',
        Component: FormatConvertApp,
        handle: routeHandle({
          requiresAuth: true,
          appHeader: {
            title: msg('route.formatConvert.title', '格式转换'),
            description: msg('route.formatConvert.description', '本地文件与 OpenList 云文件的统一格式转换工具'),
            logo: (
              <div style={{ ...logoWrapStyle, background: 'linear-gradient(135deg, #0f766e 0%, #0ea5e9 100%)' }}>
                FM
              </div>
            ),
          },
        }),
      },
      {
        path: 'setting',
        Component: SettingApp,
        handle: routeHandle({
          requiresAuth: true,
          appHeader: {
            title: msg('route.setting.title', '设置'),
            description: msg('route.setting.description', '账号、系统与服务配置中心'),
            logo: <img alt="Settings" src={adminIcon} style={{ display: 'block', width: 44, height: 44 }} />,
          },
        }),
        children: [
          { index: true, Component: RedirectToSetting },
          { path: 'info', Component: SettingInfoApp },
          {
            path: 'user',
            Component: SettingUserApp,
            handle: routeHandle({
              appHeader: {
                title: msg('route.settingUser.title', '用户管理'),
                description: msg('route.settingUser.description', '查看和维护系统用户'),
                logo: (
                  <div style={{ ...logoWrapStyle, background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)' }}>
                    <IconComment style={{ fontSize: 20 }} />
                  </div>
                ),
              },
            }),
          },
          { path: 'user/add', Component: SettingUserAddApp },
          { path: 'user/edit/:id', Component: SettingUserEditApp },
          { path: 'system', Component: SettingSystemApp },
          {
            path: 'config/115',
            Component: SettingConfig115App,
            handle: routeHandle({
              appHeader: {
                title: msg('route.settingConfig115.title', '随机图片配置'),
                description: msg('route.settingConfig115.description', '管理随机图片来源、缓存目录与 115 登录状态'),
                logo: (
                  <div style={{ ...logoWrapStyle, background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)' }}>
                    <IconCloudStroked style={{ fontSize: 20 }} />
                  </div>
                ),
              },
            }),
          },
          { path: 'config/rsshub', Component: SettingConfigRsshubApp },
          {
            path: 'config/account',
            Component: SettingConfigAccountCenterApp,
            handle: routeHandle({
              appHeader: {
                title: msg('route.settingAccount.title', '账号管理'),
                description: msg('route.settingAccount.description', ''),
                logo: (
                  <div style={{ ...logoWrapStyle, background: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 100%)' }}>
                    <IconMailStroked style={{ fontSize: 20 }} />
                  </div>
                ),
              },
            }),
          },
        ],
      },
      { path: 'admin', Component: RedirectToSetting },
    ],
  },
]);
