import { useEffect, useState } from 'react';
import { Avatar, Button, Card, Empty, Space, Table, Tag, Toast } from '@douyinfe/semi-ui';
import { getRoleList, getUserList } from '@/services/user';
import { useOutletContext } from 'react-router';
import type { RoleInfoResponse, UserInfoResponse } from '@volix/types';
import type { SettingOutletContext } from '@/apps/setting/types';

function SettingUserApp() {
  const { isAdmin, requestNavigate } = useOutletContext<SettingOutletContext>();
  const [userList, setUserList] = useState<UserInfoResponse[]>([]);
  const [roleList, setRoleList] = useState<RoleInfoResponse[]>([]);
  const tableMinWidth = 'max(100%, 1208px)';

  const loadData = async () => {
    if (!isAdmin) {
      return;
    }
    const [usersRes, rolesRes] = await Promise.all([getUserList(), getRoleList()]);
    setUserList(usersRes.data);
    setRoleList(rolesRes.data);
  };

  useEffect(() => {
    loadData().catch(() => {
      Toast.error('获取用户信息失败');
    });
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <Card title="用户管理" shadows="hover" style={{ width: '100%' }} bodyStyle={{ width: '100%' }}>
        <Empty title="暂无权限" description="仅管理员可查看用户管理" />
      </Card>
    );
  }

  return (
    <Card
      title="用户管理"
      shadows="hover"
      style={{ width: '100%' }}
      bodyStyle={{ width: '100%' }}
      headerExtraContent={
        <Button type="primary" onClick={() => requestNavigate('/setting/user/add')}>
          添加用户
        </Button>
      }
    >
      <Space vertical spacing={12} style={{ width: '100%' }}>
        <Table<UserInfoResponse>
          rowKey="id"
          pagination={false}
          style={{ width: '100%' }}
          tableLayout="fixed"
          scroll={{ x: tableMinWidth }}
          size="small"
          dataSource={userList}
          columns={[
            {
              title: '头像',
              dataIndex: 'avatar',
              key: 'avatar',
              width: 88,
              render: (_: unknown, record: UserInfoResponse) => (
                <Avatar size="small" src={record.avatar}>
                  {record.nickname?.slice(0, 1) || record.email.slice(0, 1).toUpperCase()}
                </Avatar>
              ),
            },
            {
              title: '昵称',
              dataIndex: 'nickname',
              key: 'nickname',
              width: 220,
              ellipsis: {
                showTitle: true,
              },
              render: (value: string | undefined) => value || '-',
            },
            {
              title: '邮箱',
              dataIndex: 'email',
              key: 'email',
              ellipsis: {
                showTitle: true,
              },
            },
            {
              title: '邮箱验证',
              dataIndex: 'emailVerified',
              key: 'emailVerified',
              width: 120,
              render: (value: boolean) => (value ? <Tag color="green">已验证</Tag> : <Tag color="orange">未验证</Tag>),
            },
            {
              title: '系统角色',
              dataIndex: 'role',
              key: 'role',
              width: 120,
              render: (value: UserInfoResponse['role']) => (value === 'admin' ? '管理员' : '普通用户'),
            },
            {
              title: '角色组',
              dataIndex: 'roleKey',
              key: 'roleKey',
              width: 220,
              ellipsis: {
                showTitle: true,
              },
              render: (value: string | undefined) =>
                roleList.find(item => item.roleKey === value)?.roleName || value || 'default',
            },
            {
              title: '操作',
              key: 'action',
              width: 120,
              render: (_: unknown, record: UserInfoResponse) => (
                <Button
                  theme="borderless"
                  type="primary"
                  onClick={() => requestNavigate(`/setting/user/edit/${record.id}`)}
                >
                  编辑
                </Button>
              ),
            },
          ]}
        />
      </Space>
    </Card>
  );
}

export default SettingUserApp;
