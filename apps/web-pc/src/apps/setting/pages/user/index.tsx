import { useEffect, useState } from 'react';
import { Avatar, Button, Card, Empty, Space, Table, Tag, Toast } from '@douyinfe/semi-ui';
import { getUserList } from '@/services/user';
import { useAppPageContext } from '@/hooks';
import { useI18n } from '@/i18n';
import type { UserInfoResponse } from '@volix/types';

function SettingUserApp() {
  const { t } = useI18n();
  const { isAdmin, requestNavigate } = useAppPageContext();
  const [userList, setUserList] = useState<UserInfoResponse[]>([]);
  const tableMinWidth = 'max(100%, 980px)';

  const loadData = async () => {
    if (!isAdmin) {
      return;
    }
    const usersRes = await getUserList();
    setUserList(usersRes.data);
  };

  useEffect(() => {
    loadData().catch(() => {
      Toast.error(t('setting.user.loadFailed'));
    });
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <Card title={t('setting.user.title')} shadows="hover" style={{ width: '100%' }} bodyStyle={{ width: '100%' }}>
        <Empty title={t('admin.empty.noPermission.title')} description={t('setting.user.noPermission')} />
      </Card>
    );
  }

  return (
    <Card
      title={t('setting.user.title')}
      shadows="hover"
      style={{ width: '100%' }}
      bodyStyle={{ width: '100%' }}
      headerExtraContent={
        <Button type="primary" onClick={() => requestNavigate('/setting/user/add')}>
          {t('setting.user.add')}
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
              title: t('setting.user.table.avatar'),
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
              title: t('setting.user.table.nickname'),
              dataIndex: 'nickname',
              key: 'nickname',
              width: 220,
              ellipsis: {
                showTitle: true,
              },
              render: (value: string | undefined) => value || '-',
            },
            {
              title: t('admin.table.email'),
              dataIndex: 'email',
              key: 'email',
              ellipsis: {
                showTitle: true,
              },
            },
            {
              title: t('setting.user.table.emailVerified'),
              dataIndex: 'emailVerified',
              key: 'emailVerified',
              width: 120,
              render: (value: boolean) =>
                value ? (
                  <Tag color="green">{t('setting.info.verified')}</Tag>
                ) : (
                  <Tag color="orange">{t('setting.info.unverified')}</Tag>
                ),
            },
            {
              title: t('setting.user.table.role'),
              dataIndex: 'role',
              key: 'role',
              width: 120,
              render: (value: UserInfoResponse['role']) =>
                value === 'admin' ? t('admin.role.admin') : t('admin.role.user'),
            },
            {
              title: t('sqliteAdmin.table.action'),
              key: 'action',
              width: 120,
              render: (_: unknown, record: UserInfoResponse) => (
                <Button
                  theme="borderless"
                  type="primary"
                  onClick={() => requestNavigate(`/setting/user/edit/${record.id}`)}
                >
                  {t('sqliteAdmin.action.edit')}
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
