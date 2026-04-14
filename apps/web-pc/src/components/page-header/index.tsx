import { Typography } from '@douyinfe/semi-ui';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export function PageHeader(props: PageHeaderProps) {
  const { title, description, icon } = props;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {icon ? (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--app-card-icon-bg)',
              flex: '0 0 44px',
            }}
          >
            {icon}
          </div>
        ) : null}
        <div>
          <Typography.Title heading={3} style={{ margin: 0, color: 'var(--app-text)' }}>
            {title}
          </Typography.Title>
          {description ? (
            <Typography.Text style={{ color: 'var(--app-text-muted)' }}>{description}</Typography.Text>
          ) : null}
        </div>
      </div>
    </div>
  );
}
