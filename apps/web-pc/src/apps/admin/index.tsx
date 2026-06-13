import { useEffect, useState } from 'react';
import { Button, Empty, Nav, Table, Tag, Toast, Typography } from '@douyinfe/semi-ui';
import { IconArrowLeft, IconUserGroup } from '@douyinfe/semi-icons';
import { IconAvatar, IconList } from '@douyinfe/semi-icons-lab';
import { clearAuthToken } from '@/utils';
import { useNavigate } from 'react-router';
import { getCurrentUser, getUserList, setUserRole } from '@/services/user';
import { PageCard } from '@/components';
import { useI18n } from '@/i18n';
import { UserRole } from '@volix/types';
import type { UserInfoResponse } from '@volix/types';

type MenuKey = 'profile' | 'users';

function AdminApp() {
  const navigate = useNavigate();
  const { t } = useI18n();
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
      Toast.success(t('admin.roleUpdateSuccess'));
      await loadUserList();
      if (String(target.id) === String(user?.id)) {
        await loadCurrentUser();
      }
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || t('admin.error.updateFailed'));
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
      Toast.error(t('admin.error.loadUsersFailed'));
    });
  }, [isAdmin]);

  useEffect(() => {
    if (activeMenu === 'users' && !isAdmin) {
      setActiveMenu('profile');
    }
  }, [activeMenu, isAdmin]);

  const columns = [
    {
      title: t('admin.table.email'),
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: t('admin.table.role'),
      dataIndex: 'role',
      key: 'role',
      render: (_: unknown, record: UserInfoResponse) => (
        <select
          value={record.role}
          style={{
            width: 140,
            height: 32,
            padding: '0 12px',
            borderRadius: 6,
            border: '1px solid var(--semi-color-border)',
            background: 'var(--semi-color-bg-0)',
            color: 'var(--semi-color-text-0)',
          }}
          disabled={updatingUserId === record.id}
          onChange={event => {
            const value = event.target.value as UserRole;
            if (!value || value === record.role) {
              return;
            }
            onRoleChange(record, value);
          }}
        >
          <option value={UserRole.USER}>{t('admin.role.user')}</option>
          <option value={UserRole.ADMIN}>{t('admin.role.admin')}</option>
        </select>
      ),
    },
  ];

  const navItems = [
    {
      itemKey: 'common-settings',
      text: t('admin.nav.commonSettings'),
      items: [
        {
          itemKey: 'profile',
          text: t('admin.nav.profile'),
          icon: <IconAvatar />,
        },
      ],
    },
    {
      itemKey: 'admin-settings',
      text: t('admin.nav.adminSettings'),
      items: [
        {
          itemKey: 'users',
          text: t('admin.nav.users'),
          icon: <IconUserGroup />,
          disabled: !isAdmin,
        },
      ],
    },
  ];

  const renderContent = () => {
    if (activeMenu === 'profile') {
      return (
        <PageCard title={t('admin.profile.title')} shadows="hover">
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Typography.Text strong>{t('admin.profile.email')}</Typography.Text>
              <Typography.Text>{user?.email || '-'}</Typography.Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Typography.Text strong>{t('admin.profile.role')}</Typography.Text>
              <Tag color={isAdmin ? 'red' : 'blue'}>{t(isAdmin ? 'admin.role.admin' : 'admin.role.user')}</Tag>
            </div>
          </div>
        </PageCard>
      );
    }

    if (!isAdmin) {
      return (
        <PageCard title={t('admin.user.title')} shadows="hover">
          <Empty title={t('admin.empty.noPermission.title')} description={t('admin.empty.noPermission.description')} />
        </PageCard>
      );
    }

    return (
      <PageCard title={t('admin.user.title')} shadows="hover">
        <Table<UserInfoResponse> rowKey="id" columns={columns} dataSource={userList} pagination={false} />
      </PageCard>
    );
  };

  return (
    <div style={{ width: '100%' }}>
      <Nav
        mode="horizontal"
        header={{
          logo: <IconList style={{ height: 32, fontSize: 32 }} />,
          text: t('admin.header.title'),
        }}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Typography.Text>{user?.email}</Typography.Text>
            <Tag color={isAdmin ? 'red' : 'blue'}>{t(isAdmin ? 'admin.role.admin' : 'admin.role.user')}</Tag>
            <Button icon={<IconArrowLeft />} onClick={() => navigate('/')}>
              {t('admin.action.backHome')}
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
