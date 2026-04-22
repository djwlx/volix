import { createBrowserRouter } from 'react-router';
import {
  IconApps,
  IconBolt,
  IconCalendarClock,
  IconCloudStroked,
  IconComment,
  IconImage,
  IconMailStroked,
  IconStar,
  IconTabsStroked,
} from '@douyinfe/semi-icons';
import HomeApp from '@/apps/home';
import AiChatApp from '@/apps/ai-chat';
import SqliteAdminApp from '@/apps/sqlite-admin';
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
import SettingConfigBangumiApp from '@/apps/setting/pages/config/config-bangumi';
import SettingAnimeSubscriptionApp from '@/apps/setting/pages/anime-subscription';
import SettingAnimeSubscriptionAddApp from '@/apps/setting/pages/anime-subscription/add';
import SettingAnimeSubscriptionEditApp from '@/apps/setting/pages/anime-subscription/edit';
import SettingOpenlistAiOrganizerApp from '@/apps/setting/pages/openlist-ai-organizer';
import SettingScheduledTaskApp from '@/apps/setting/pages/scheduled-task';
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
        title: '我的应用',
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
        path: 'ai',
        Component: AiChatApp,
        handle: routeHandle({
          requiresAuth: true,
          appHeader: {
            title: 'AI 助手',
            description: '统一会话、工具执行与审批确认的工作台',
            logo: (
              <div
                style={{
                  ...logoWrapStyle,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #0f172a 0%, #0369a1 55%, #38bdf8 100%)',
                  boxShadow: '0 16px 28px rgba(14, 165, 233, 0.24)',
                }}
              >
                <IconBolt style={{ fontSize: 20 }} />
              </div>
            ),
          },
        }),
      },
      {
        path: 'anime-subscription',
        Component: SettingAnimeSubscriptionApp,
        handle: routeHandle({
          requiresAuth: true,
          appHeader: {
            title: '自动追番',
            description: '查看和维护自动追番任务',
            logo: (
              <div style={{ ...logoWrapStyle, background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)' }}>
                <IconStar style={{ fontSize: 20 }} />
              </div>
            ),
          },
        }),
      },
      {
        path: 'anime-subscription/add',
        Component: SettingAnimeSubscriptionAddApp,
        handle: routeHandle({
          requiresAuth: true,
          appHeader: {
            title: '新增追番任务',
            description: '创建新的自动追番规则',
            logo: (
              <div style={{ ...logoWrapStyle, background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)' }}>
                <IconStar style={{ fontSize: 20 }} />
              </div>
            ),
          },
        }),
      },
      {
        path: 'anime-subscription/edit/:id',
        Component: SettingAnimeSubscriptionEditApp,
        handle: routeHandle({
          requiresAuth: true,
          appHeader: {
            title: '编辑追番任务',
            description: '调整追番规则和投递策略',
            logo: (
              <div style={{ ...logoWrapStyle, background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)' }}>
                <IconStar style={{ fontSize: 20 }} />
              </div>
            ),
          },
        }),
      },
      {
        path: 'openlist-ai-organizer',
        Component: SettingOpenlistAiOrganizerApp,
        handle: routeHandle({
          requiresAuth: true,
          appHeader: {
            title: 'AI 文件整理',
            description: '分析目录、确认计划并执行整理',
            logo: (
              <div style={{ ...logoWrapStyle, background: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)' }}>
                <IconImage style={{ fontSize: 20 }} />
              </div>
            ),
          },
        }),
      },
      {
        path: 'scheduled-task',
        Component: SettingScheduledTaskApp,
        handle: routeHandle({
          requiresAuth: true,
          appHeader: {
            title: '定时任务',
            description: '查看、执行和管理系统定时任务',
            logo: (
              <div style={{ ...logoWrapStyle, background: 'linear-gradient(135deg, #1d4ed8 0%, #38bdf8 100%)' }}>
                <IconCalendarClock style={{ fontSize: 20 }} />
              </div>
            ),
          },
        }),
      },
      {
        path: 'sqlite-admin',
        Component: SqliteAdminApp,
        handle: routeHandle({
          requiresAuth: true,
          appHeader: {
            title: 'SQLite 数据管理',
            description: '管理员可直接浏览和编辑当前应用数据库中的表数据',
            logo: (
              <div style={{ ...logoWrapStyle, background: 'linear-gradient(135deg, #020617 0%, #0369a1 100%)' }}>
                <IconTabsStroked style={{ fontSize: 20 }} />
              </div>
            ),
          },
        }),
      },
      {
        path: 'formatter',
        Component: FormatterApp,
        handle: routeHandle({
          appHeader: {
            title: '智能格式化',
            description: '支持 JSON、XML、Base64 的智能识别、递归解码和结构化查看',
            logo: <img alt="智能格式化" src={formatterIcon} style={{ display: 'block', width: 44, height: 44 }} />,
          },
        }),
      },
      {
        path: 'color-picker',
        Component: ColorPickerApp,
        handle: routeHandle({
          appHeader: {
            title: '取色器',
            description: '支持网页取色和图片点击取色，自动生成 HEX、RGB、HSL',
            logo: <img alt="取色器" src={colorPickerIcon} style={{ display: 'block', width: 44, height: 44 }} />,
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
        path: 'setting',
        Component: SettingApp,
        handle: routeHandle({
          requiresAuth: true,
          appHeader: {
            title: '设置',
            description: '账号、系统与服务配置中心',
            logo: <img alt="设置" src={adminIcon} style={{ display: 'block', width: 44, height: 44 }} />,
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
                title: '用户管理',
                description: '查看和维护系统用户',
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
          { path: 'role', Component: SettingRoleApp },
          { path: 'role/add', Component: SettingRoleAddApp },
          { path: 'role/edit/:roleKey', Component: SettingRoleEditApp },
          { path: 'system', Component: SettingSystemApp },
          {
            path: 'config/115',
            Component: SettingConfig115App,
            handle: routeHandle({
              appHeader: {
                title: '115 配置',
                description: '管理 115 账号和能力配置',
                logo: (
                  <div style={{ ...logoWrapStyle, background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)' }}>
                    <IconCloudStroked style={{ fontSize: 20 }} />
                  </div>
                ),
              },
            }),
          },
          {
            path: 'config/ai',
            Component: SettingConfigAiApp,
            handle: routeHandle({
              appHeader: {
                title: 'AI 配置',
                description: '配置模型、接口和默认行为',
                logo: (
                  <div style={{ ...logoWrapStyle, background: 'linear-gradient(135deg, #0f172a 0%, #0369a1 100%)' }}>
                    <IconBolt style={{ fontSize: 20 }} />
                  </div>
                ),
              },
            }),
          },
          { path: 'config/bangumi', Component: SettingConfigBangumiApp },
          { path: 'config/qbittorrent', Component: SettingConfigQbittorrentApp },
          { path: 'config/openlist', Component: SettingConfigOpenlistApp },
          {
            path: 'config/smtp',
            Component: SettingConfigSmtpApp,
            handle: routeHandle({
              appHeader: {
                title: 'SMTP 配置',
                description: '配置邮件发送服务',
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
