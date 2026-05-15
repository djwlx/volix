import { AppCard } from './components';
import { IconStar, IconTabsStroked } from '@douyinfe/semi-icons';
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
            {authed ? (
              <AppCard
                title="我的喜欢"
                description="查看和管理你收藏的随机图片。"
                link="/pic/likes"
                icon={
                  <div style={{ ...moduleIconStyle, background: 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)' }}>
                    <IconStar size="large" />
                  </div>
                }
              />
            ) : null}
            <AppCard
              title="RSS 阅读器"
              description="对接 RSSHub，按订阅源浏览最新内容。"
              link="/rss"
              icon={
                <div style={{ ...moduleIconStyle, background: 'linear-gradient(135deg, #0284c7 0%, #14b8a6 100%)' }}>
                  RSS
                </div>
              }
            />
          </div>
        </div>

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
