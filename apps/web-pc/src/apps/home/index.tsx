import { AppCard } from './components';
import { IconStar, IconTabsStroked } from '@douyinfe/semi-icons';
import { useI18n } from '@/i18n';
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
  const { t } = useI18n();
  const { user } = useUser();
  const authed = isAuthenticated();
  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.sectionBlock}>
          <div className={styles.sectionLabel}>{t('home.section.tools')}</div>
          <div className={styles.cardGrid}>
            <AppCard
              title={t('home.card.formatter.title')}
              description={t('home.card.formatter.description')}
              icon={formatterIcon}
              link="/formatter"
            />
            <AppCard
              title={t('home.card.colorPicker.title')}
              description={t('home.card.colorPicker.description')}
              link="/color-picker"
              icon={colorPickerIcon}
            />
            <AppCard
              title={t('home.card.pic.title')}
              description={t('home.card.pic.description')}
              icon={picIcon}
              link="/pic"
            />
            {authed ? (
              <AppCard
                title={t('home.card.likes.title')}
                description={t('home.card.likes.description')}
                link="/pic/likes"
                icon={
                  <div style={{ ...moduleIconStyle, background: 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)' }}>
                    <IconStar size="large" />
                  </div>
                }
              />
            ) : null}
            <AppCard
              title={t('home.card.rss.title')}
              description={t('home.card.rss.description')}
              link="/rss"
              icon={
                <div style={{ ...moduleIconStyle, background: 'linear-gradient(135deg, #0284c7 0%, #14b8a6 100%)' }}>
                  RSS
                </div>
              }
            />
            {authed ? (
              <AppCard
                title={t('home.card.formatConvert.title')}
                description={t('home.card.formatConvert.description')}
                link="/format-convert"
                icon={
                  <div style={{ ...moduleIconStyle, background: 'linear-gradient(135deg, #0f766e 0%, #0ea5e9 100%)' }}>
                    FM
                  </div>
                }
              />
            ) : null}
          </div>
        </div>

        {authed ? (
          <div className={styles.sectionBlock}>
            <div className={styles.sectionLabel}>{t('home.section.admin')}</div>
            <div className={styles.cardGrid}>
              <AppCard
                title={t('home.card.setting.title')}
                description={t('home.card.setting.description')}
                icon={adminIcon}
                link="/setting/info"
              />
              {isAdmin ? (
                <AppCard
                  title={t('home.card.sqlite.title')}
                  description={t('home.card.sqlite.description')}
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
