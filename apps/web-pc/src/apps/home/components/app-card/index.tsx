import { Card } from '@douyinfe/semi-ui';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import styles from './index.module.scss';

interface AppCardProps {
  title: string;
  description?: string;
  icon?: string | ReactNode;
  link?: string;
  featured?: boolean;
}

export function AppCard(props: AppCardProps) {
  const { title, description, icon, link, featured = false } = props;
  const navigate = useNavigate();
  const onClick = () => {
    if (!link) {
      return;
    }
    navigate(link);
  };
  return (
    <div
      onClick={onClick}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className={`${styles.link} ${featured ? styles.featured : ''}`}
      role="button"
      tabIndex={0}
    >
      <Card className={styles.card} bodyStyle={{ height: '100%', padding: 24 }} shadows="always">
        <div className={styles.body}>
          <div className={styles.iconWrap}>
            {typeof icon === 'string' ? <img alt={title} className={styles.iconImage} src={icon} /> : icon}
          </div>
          <div className={styles.text}>
            <div className={styles.title}>{title}</div>
            {description ? <div className={styles.description}>{description}</div> : null}
          </div>
        </div>
      </Card>
    </div>
  );
}
