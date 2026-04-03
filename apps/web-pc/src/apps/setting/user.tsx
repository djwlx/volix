import { useEffect, useState } from 'react';
import { Avatar, Button, Card, Empty, Table, Toast } from '@douyinfe/semi-ui';
import { getRoleList, getUserList } from '@/services/user';
import { useOutletContext } from 'react-router';
import type { RoleInfoResponse, UserInfoResponse } from '@volix/types';
import type { SettingOutletContext } from './index';

function SettingUserApp() {
  const { isAdmin, requestNavigate } = useOutletContext<SettingOutletContext>();
  const [userList, setUserList] = useState<UserInfoResponse[]>([]);
  const [roleList, setRoleList] = useState<RoleInfoResponse[]>([]);

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
      <Card title="用户管理" shadows="hover">
        <Empty title="暂无权限" description="仅管理员可查看用户管理" />
      </Card>
    );
  }

  return (
    <Card
      title="用户管理"
      shadows="hover"
      headerExtraContent={
        <Button type="primary" onClick={() => requestNavigate('/setting/user/add')}>
          添加用户
        </Button>
      }
    >
      <Table<UserInfoResponse>
        rowKey="id"
        pagination={false}
        scroll={{ x: 980 }}
        size="small"
        dataSource={userList}
        columns={[
          {
            title: '头像',
            dataIndex: 'avatar',
            key: 'avatar',
            width: 100,
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
            render: (value: string | undefined) => value || '-',
          },
          {
            title: '邮箱',
            dataIndex: 'email',
            key: 'email',
          },
          {
            title: '系统角色',
            dataIndex: 'role',
            key: 'role',
            width: 160,
            render: (value: UserInfoResponse['role']) => (value === 'admin' ? '管理员' : '普通用户'),
          },
          {
            title: '角色组',
            dataIndex: 'roleKey',
            key: 'roleKey',
            width: 240,
            render: (value: string | undefined) => roleList.find(item => item.roleKey === value)?.roleName || value || 'default',
          },
          {
            title: '操作',
            key: 'action',
            width: 120,
            render: (_: unknown, record: UserInfoResponse) => (
              <Button theme="borderless" type="primary" onClick={() => requestNavigate(`/setting/user/edit/${record.id}`)}>
                编辑
              </Button>
            ),
          },
        ]}
      />
    </Card>
  );
}

export default SettingUserApp;
