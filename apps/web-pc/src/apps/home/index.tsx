import { AppCard } from './components';
import { Button, Tag } from '@douyinfe/semi-ui';
import { IconApps, IconBolt, IconComment, IconExit, IconSetting } from '@douyinfe/semi-icons';
import { clearAuthToken, isAuthenticated } from '@/utils';
import { useNavigate } from 'react-router';
import { useUser } from '@/hooks';
import { UserRole } from '@volix/types';
import styles from './index.module.scss';
import { AppHeader } from '@/components';
import formatterIcon from '@/assets/icons/formatter.svg';
import colorPickerIcon from '@/assets/icons/color-picker.svg';
import picIcon from '@/assets/icons/pic.svg';
import adminIcon from '@/assets/icons/admin.svg';

function HomeApp() {
  const navigate = useNavigate();
  const { user } = useUser();
  const authed = isAuthenticated();
  const isAdmin = user?.role === UserRole.ADMIN;

  const onLogout = () => {
    clearAuthToken();
    navigate('/', { replace: true });
  };

  return (
    <div className={styles.page}>
      <AppHeader
        title="我的应用"
        logo={
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #14B8A6 0%, #22C55E 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconApps style={{ fontSize: 20, color: '#fff' }} />
          </div>
        }
        onLogoClick={() => navigate('/')}
        userOverride={user || undefined}
        menuItems={
          authed
            ? [
                { key: 'setting', label: '系统管理', icon: <IconSetting />, onClick: () => navigate('/setting/info') },
                { key: 'logout', label: '退出登录', icon: <IconExit />, type: 'danger', onClick: onLogout },
              ]
            : []
        }
      />
      <div className={styles.content}>
        {authed ? (
          <section className={styles.hero}>
            <div className={styles.heroMain}>
              <div className={styles.heroBadge}>
                <IconBolt />
                Featured Workspace
              </div>
              <h1 className={styles.heroTitle}>AI 助手</h1>
              <p className={styles.heroDescription}>
                统一对话、工具执行、审批确认和历史会话。进入后就是完整的 AI 工作台，不再藏在后台设置里。
              </p>
              <div className={styles.heroActions}>
                <Button
                  theme="solid"
                  type="primary"
                  size="large"
                  icon={<IconComment />}
                  onClick={() => navigate('/ai')}
                >
                  继续会话
                </Button>
                <Button size="large" onClick={() => navigate('/setting/openlist-ai-organizer')}>
                  查看任务
                </Button>
              </div>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.heroStatCard}>
                <span className={styles.heroStatValue}>AI</span>
                <span className={styles.heroStatLabel}>会话工作台</span>
              </div>
              <div className={styles.heroStatCard}>
                <span className={styles.heroStatValue}>SSE</span>
                <span className={styles.heroStatLabel}>流式响应</span>
              </div>
              <div className={styles.heroStatCard}>
                <span className={styles.heroStatValue}>Tools</span>
                <span className={styles.heroStatLabel}>内联工具审批</span>
              </div>
            </div>
          </section>
        ) : null}

        {authed ? (
          <div className={styles.sectionTitleRow}>
            <div>
              <div className={styles.sectionEyebrow}>Workspace</div>
              <div className={styles.sectionTitle}>常用应用</div>
            </div>
            <Tag color="blue">已登录</Tag>
          </div>
        ) : null}

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
          <AppCard
            title="随机图片"
            description="快速切换一张随机图片，保留轻量的浏览体验。"
            icon={picIcon}
            link="/pic"
          />
          {authed ? (
            <AppCard
              title="后台管理"
              description="进入系统设置、账号信息和后台配置。"
              icon={adminIcon}
              link="/setting/info"
            />
          ) : null}
          {isAdmin ? (
            <AppCard
              title="SQLite 数据管理"
              description="直接查看并编辑当前应用数据库里的表数据，适合管理员快速修正记录。"
              link="/sqlite-admin"
              icon={
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #020617 0%, #0369a1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                  }}
                >
                  DB
                </div>
              }
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default HomeApp;
