import type { ComponentType } from 'react';
import { Empty } from '@douyinfe/semi-ui';
import type { AppFeature } from '@volix/types';
import { useUser } from '@/hooks';

/**
 * 高阶组件：为功能路由进行权限检查
 * @param Component 要路由的组件
 * @param requiredFeatures 需要的功能权限列表
 */
function withFeatureRequired(Component: ComponentType, requiredFeatures: AppFeature[]) {
  return function ProtectedComponent() {
    const { user, loading } = useUser();

    const hasPermission = requiredFeatures.every(feature => user?.featurePermissions?.includes(feature)) ?? false;

    if (loading) {
      return <div style={{ padding: 20 }}>加载中...</div>;
    }

    if (!hasPermission) {
      return (
        <div
          style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <Empty title="无权限访问" description="您没有访问此功能的权限，请联系管理员。" style={{ marginTop: -60 }} />
        </div>
      );
    }

    return <Component />;
  };
}

export default withFeatureRequired;
