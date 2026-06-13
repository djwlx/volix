import { Card } from '@douyinfe/semi-ui';
import type { ComponentProps, ReactNode } from 'react';

type SemiCardProps = ComponentProps<typeof Card>;

interface PageCardProps extends Omit<SemiCardProps, 'title' | 'headerExtraContent'> {
  title?: ReactNode;
  headerExtraContent?: ReactNode;
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  marginBottom: 16,
  flexWrap: 'wrap' as const,
};

const titleStyle = {
  margin: 0,
  fontSize: 20,
  fontWeight: 600,
  lineHeight: '28px',
  color: 'var(--semi-color-text-0)',
};

export function PageCard(props: PageCardProps) {
  const { title, headerExtraContent, children, ...cardProps } = props;

  return (
    <Card {...cardProps}>
      {title || headerExtraContent ? (
        <div style={headerStyle}>
          <div style={titleStyle}>{title}</div>
          {headerExtraContent}
        </div>
      ) : null}
      {children}
    </Card>
  );
}
