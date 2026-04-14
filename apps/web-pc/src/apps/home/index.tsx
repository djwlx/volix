import { AppCard } from './components';
import { IconApps, IconExit, IconSetting } from '@douyinfe/semi-icons';
import { clearAuthToken, isAuthenticated } from '@/utils';
import { useNavigate } from 'react-router';
import { useUser } from '@/hooks';
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

  const onLogout = () => {
    clearAuthToken();
    navigate('/auth', { replace: true });
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
        </div>
      </div>
    </div>
  );
}

export default HomeApp;
