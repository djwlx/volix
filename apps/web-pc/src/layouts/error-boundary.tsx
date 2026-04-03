import { Button, Empty, Space, Typography } from '@douyinfe/semi-ui';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router';

function AppErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = '页面加载失败';
  let description = '应用发生了一个未处理错误，请稍后重试。';

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    description = typeof error.data === 'string' ? error.data : description;
  } else if (error instanceof Error) {
    description = error.message || description;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        boxSizing: 'border-box',
      }}
    >
      <Empty
        title={title}
        description={
          <Space vertical align="center" spacing={8}>
            <Typography.Text type="secondary">{description}</Typography.Text>
            <Space>
              <Button onClick={() => window.location.reload()}>刷新页面</Button>
              <Button type="primary" onClick={() => navigate('/', { replace: true })}>
                返回首页
              </Button>
            </Space>
          </Space>
        }
      />
    </div>
  );
}

export default AppErrorBoundary;
