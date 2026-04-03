import { Skeleton, Spin, Typography } from '@douyinfe/semi-ui';

interface LoadingProps {
  type?: 'page' | 'block';
  text?: string;
  rows?: number;
}

export function Loading({ type = 'block', text = '加载中...', rows = 6 }: LoadingProps) {
  if (type === 'page') {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <Spin size="large" />
        <Typography.Text type="secondary">{text}</Typography.Text>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, width: '100%' }}>
      <Skeleton placeholder={<Skeleton.Paragraph rows={rows} />} active />
    </div>
  );
}
