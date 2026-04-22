import { AppCard } from './components';
import { IconCalendarClock, IconComment, IconImage, IconStar, IconTabsStroked } from '@douyinfe/semi-icons';
import { isAuthenticated } from '@/utils';
import { useUser } from '@/hooks';
import { UserRole } from '@volix/types';
import styles from './index.module.scss';
import formatterIcon from '@/assets/icons/formatter.svg';
import colorPickerIcon from '@/assets/icons/color-picker.svg';
import picIcon from '@/assets/icons/pic.svg';
import adminIcon from '@/assets/icons/admin.svg';

const moduleIconStyle = {
  width: 52,
  height: 52,
  borderRadius: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontWeight: 800,
};

function HomeApp() {
  const { user } = useUser();
  const authed = isAuthenticated();
  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.sectionBlock}>
          <div className={styles.sectionLabel}>常用工具</div>
          <div className={styles.cardGrid}>
            <AppCard
              title="智能格式化"
              description="JSON / XML / Base64 一站式处理，适合调试复杂结构。"
              icon={formatterIcon}
              link="/formatter"
            />
            <AppCard
              title="取色器"
              description="从网页或图片中提取颜色，快速拿到 HEX、RGB、HSL。"
              link="/color-picker"
              icon={colorPickerIcon}
            />
            <AppCard title="随机图片" description="快速切换一张随机图片。" icon={picIcon} link="/pic" />
          </div>
        </div>

        {authed ? (
          <div className={styles.sectionBlock}>
            <div className={styles.sectionLabel}>工作台</div>
            <div className={styles.cardGrid}>
              <AppCard
                title="AI 助手"
                description="统一会话、工具执行与审批确认。"
                link="/ai"
                icon={
                  <div style={{ ...moduleIconStyle, background: 'linear-gradient(135deg, #0f172a 0%, #0284c7 100%)' }}>
                    <IconComment size="large" />
                  </div>
                }
              />
              {isAdmin ? (
                <AppCard
                  title="自动追番"
                  description="查看和维护追番任务。"
                  link="/anime-subscription"
                  icon={
                    <div
                      style={{ ...moduleIconStyle, background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)' }}
                    >
                      <IconStar size="large" />
                    </div>
                  }
                />
              ) : null}
              {isAdmin ? (
                <AppCard
                  title="AI 文件整理"
                  description="分析目录、确认计划并执行整理。"
                  link="/openlist-ai-organizer"
                  icon={
                    <div
                      style={{ ...moduleIconStyle, background: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)' }}
                    >
                      <IconImage size="large" />
                    </div>
                  }
                />
              ) : null}
              {isAdmin ? (
                <AppCard
                  title="定时任务"
                  description="查看和执行系统定时任务。"
                  link="/scheduled-task"
                  icon={
                    <div
                      style={{ ...moduleIconStyle, background: 'linear-gradient(135deg, #1d4ed8 0%, #38bdf8 100%)' }}
                    >
                      <IconCalendarClock size="large" />
                    </div>
                  }
                />
              ) : null}
            </div>
          </div>
        ) : null}

        {authed ? (
          <div className={styles.sectionBlock}>
            <div className={styles.sectionLabel}>管理与配置</div>
            <div className={styles.cardGrid}>
              <AppCard
                title="设置"
                description="进入配置中心管理账号与系统设置。"
                icon={adminIcon}
                link="/setting/info"
              />
              {isAdmin ? (
                <AppCard
                  title="SQLite 数据管理"
                  description="直接查看并编辑当前应用数据库里的表数据。"
                  link="/sqlite-admin"
                  icon={
                    <div
                      style={{ ...moduleIconStyle, background: 'linear-gradient(135deg, #020617 0%, #0369a1 100%)' }}
                    >
                      <IconTabsStroked size="large" />
                    </div>
                  }
                />
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default HomeApp;
