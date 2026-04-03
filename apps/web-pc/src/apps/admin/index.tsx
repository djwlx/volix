import { useEffect, useState } from 'react';
import { Button, Card, Empty, Nav, Select, Table, Tag, Toast, Typography } from '@douyinfe/semi-ui';
import { IconArrowLeft, IconUserGroup } from '@douyinfe/semi-icons';
import { IconAvatar, IconList } from '@douyinfe/semi-icons-lab';
import { clearAuthToken } from '@/utils';
import { useNavigate } from 'react-router';
import { getCurrentUser, getUserList, setUserRole } from '@/services/user';
import { UserRole } from '@volix/types';
import type { UserInfoResponse } from '@volix/types';

type MenuKey = 'profile' | 'users';

function AdminApp() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfoResponse>();
  const [userList, setUserList] = useState<UserInfoResponse[]>([]);
  const [updatingUserId, setUpdatingUserId] = useState<string | number>();
  const [activeMenu, setActiveMenu] = useState<MenuKey>('profile');
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const isAdmin = user?.role === UserRole.ADMIN;

  const loadCurrentUser = async () => {
    const res = await getCurrentUser();
    setUser(res.data);
  };

  const loadUserList = async () => {
    if (!isAdmin) {
      return;
    }
    const res = await getUserList();
    setUserList(res.data);
  };

  const onLogout = () => {
    clearAuthToken();
    navigate('/auth', { replace: true });
  };

  const onRoleChange = async (target: UserInfoResponse, role: UserRole) => {
    try {
      setUpdatingUserId(target.id);
      await setUserRole({ userId: target.id, role });
      Toast.success('角色更新成功');
      await loadUserList();
      if (String(target.id) === String(user?.id)) {
        await loadCurrentUser();
      }
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || '更新失败');
    } finally {
      setUpdatingUserId(undefined);
    }
  };

  useEffect(() => {
    loadCurrentUser().catch(() => {
      onLogout();
    });
  }, []);

  useEffect(() => {
    loadUserList().catch(() => {
      Toast.error('获取用户列表失败');
    });
  }, [isAdmin]);

  useEffect(() => {
    if (activeMenu === 'users' && !isAdmin) {
      setActiveMenu('profile');
    }
  }, [activeMenu, isAdmin]);

  const columns = [
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (_: unknown, record: UserInfoResponse) => (
        <Select
          value={record.role}
          style={{ width: 140 }}
          disabled={updatingUserId === record.id}
          onChange={value => {
            if (!value || value === record.role) {
              return;
            }
            onRoleChange(record, value as UserRole);
          }}
        >
          <Select.Option value={UserRole.USER}>普通用户</Select.Option>
          <Select.Option value={UserRole.ADMIN}>管理员</Select.Option>
        </Select>
      ),
    },
  ];

  const navItems = [
    {
      itemKey: 'common-settings',
      text: '普通设置',
      items: [
        {
          itemKey: 'profile',
          text: '个人信息',
          icon: <IconAvatar />,
        },
      ],
    },
    {
      itemKey: 'admin-settings',
      text: '管理员设置',
      items: [
        {
          itemKey: 'users',
          text: '用户信息',
          icon: <IconUserGroup />,
          disabled: !isAdmin,
        },
      ],
    },
  ];

  const renderContent = () => {
    if (activeMenu === 'profile') {
      return (
        <Card title="个人信息" shadows="hover">
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Typography.Text strong>邮箱：</Typography.Text>
              <Typography.Text>{user?.email || '-'}</Typography.Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Typography.Text strong>角色：</Typography.Text>
              <Tag color={isAdmin ? 'red' : 'blue'}>{isAdmin ? '管理员' : '普通用户'}</Tag>
            </div>
          </div>
        </Card>
      );
    }

    if (!isAdmin) {
      return (
        <Card title="用户信息" shadows="hover">
          <Empty title="暂无权限" description="仅管理员可查看用户信息" />
        </Card>
      );
    }

    return (
      <Card title="用户信息" shadows="hover">
        <Table<UserInfoResponse> rowKey="id" columns={columns} dataSource={userList} pagination={false} />
      </Card>
    );
  };

  return (
    <div style={{ width: '100%' }}>
      <Nav
        mode="horizontal"
        header={{
          logo: <IconList style={{ height: 32, fontSize: 32 }} />,
          text: '后台管理',
        }}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Typography.Text>{user?.email}</Typography.Text>
            <Tag color={isAdmin ? 'red' : 'blue'}>{isAdmin ? '管理员' : '普通用户'}</Tag>
            <Button icon={<IconArrowLeft />} onClick={() => navigate('/')}>
              返回首页
            </Button>
          </div>
        }
      />

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        <Nav
          mode="vertical"
          style={{ width: isNavCollapsed ? 64 : 240, borderRight: '1px solid var(--semi-color-border)' }}
          bodyStyle={{ paddingTop: 8 }}
          items={navItems}
          selectedKeys={[activeMenu]}
          defaultOpenKeys={['common-settings', 'admin-settings']}
          isCollapsed={isNavCollapsed}
          onCollapseChange={setIsNavCollapsed}
          footer={{
            collapseButton: true,
          }}
          onSelect={data => {
            const key = data.itemKey as MenuKey;
            if (key === 'users' && !isAdmin) {
              return;
            }
            setActiveMenu(key);
          }}
        />
        <div style={{ flex: 1, padding: 16, boxSizing: 'border-box' }}>{renderContent()}</div>
      </div>
    </div>
  );
}

export default AdminApp;
