import { useEffect, useState } from 'react';
import { Button, Card, Empty, Popconfirm, Space, Table, Tag, Toast } from '@douyinfe/semi-ui';
import { getRoleList, removeRole } from '@/services/user';
import { useOutletContext } from 'react-router';
import { AppFeature } from '@volix/types';
import type { RoleInfoResponse } from '@volix/types';
import type { SettingOutletContext } from '@/apps/setting/types';
import { featureLabelMap } from './constants';

function SettingRoleApp() {
  const { isAdmin, requestNavigate } = useOutletContext<SettingOutletContext>();
  const [roleList, setRoleList] = useState<RoleInfoResponse[]>([]);
  const tableMinWidth = 'max(100%, 1060px)';

  const loadRoleList = async () => {
    if (!isAdmin) {
      return;
    }
    const res = await getRoleList();
    setRoleList(res.data);
  };

  useEffect(() => {
    loadRoleList().catch(() => {
      Toast.error('获取角色列表失败');
    });
  }, [isAdmin]);

  const onRemoveRole = async (roleKey: string) => {
    try {
      await removeRole(roleKey);
      await loadRoleList();
      Toast.success('角色已删除');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || '删除失败');
    }
  };

  if (!isAdmin) {
    return (
      <Card title="角色管理" shadows="hover" style={{ width: '100%' }} bodyStyle={{ width: '100%' }}>
        <Empty title="暂无权限" description="仅管理员可查看角色管理" />
      </Card>
    );
  }

  return (
    <Card
      title="角色管理"
      shadows="hover"
      style={{ width: '100%' }}
      bodyStyle={{ width: '100%' }}
      headerExtraContent={
        <Button type="primary" onClick={() => requestNavigate('/setting/role/add')}>
          添加角色
        </Button>
      }
    >
      <Space vertical spacing={12} style={{ width: '100%' }}>
        <Table<RoleInfoResponse>
          rowKey="roleKey"
          pagination={false}
          style={{ width: '100%' }}
          tableLayout="fixed"
          scroll={{ x: tableMinWidth }}
          size="small"
          dataSource={roleList}
          columns={[
            {
              title: '角色名称',
              dataIndex: 'roleName',
              key: 'roleName',
              width: 220,
              ellipsis: {
                showTitle: true,
              },
            },
            {
              title: '功能权限',
              dataIndex: 'features',
              key: 'features',
              render: (features: AppFeature[]) =>
                features.length === 0 ? (
                  '-'
                ) : (
                  <Space wrap>
                    {features.map(feature => (
                      <Tag key={feature} color="cyan">
                        {featureLabelMap[feature]}
                      </Tag>
                    ))}
                  </Space>
                ),
            },
            {
              title: '操作',
              key: 'action',
              width: 220,
              render: (_: unknown, record: RoleInfoResponse) =>
                record.roleKey === 'default' ? (
                  <Tag color="grey">内置</Tag>
                ) : (
                  <Space>
                    <Button
                      theme="borderless"
                      type="primary"
                      onClick={() => requestNavigate(`/setting/role/edit/${record.roleKey}`)}
                    >
                      编辑
                    </Button>
                    <Popconfirm
                      title="确定删除该角色吗？"
                      content="删除后不可恢复，且仅当没有用户绑定该角色时可删除。"
                      okType="danger"
                      onConfirm={() => onRemoveRole(record.roleKey)}
                    >
                      <Button theme="borderless" type="danger">
                        删除
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
            },
          ]}
        />
      </Space>
    </Card>
  );
}

export default SettingRoleApp;
