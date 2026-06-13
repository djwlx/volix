import { Skeleton, Space, Typography } from '@douyinfe/semi-ui';
import { Login } from '@/apps/115/login';
import { UserInfo } from '@/apps/115/user-info';
import { PicSetting } from '@/apps/115/pic-setting';
import { FileTree } from '@/apps/115/file-tree';
import { useUserInfo } from '@/apps/115/hooks/useUserInfo';
import { PageCard } from '@/components';
import { useI18n } from '@/i18n';

function SettingConfig115App() {
  const { t } = useI18n();
  const { data, loading } = useUserInfo();

  return (
    <PageCard title={t('pic115.setting.title')} shadows="hover" style={{ width: '100%' }}>
      <Skeleton placeholder={<Skeleton.Paragraph rows={6} />} loading={loading}>
        {data ? (
          <Space vertical spacing={12} style={{ width: '100%' }}>
            <Typography.Text type="secondary">{t('pic115.setting.boundAccount')}</Typography.Text>
            <UserInfo info={data} />
            <PicSetting />
            <FileTree />
          </Space>
        ) : (
          <Space vertical spacing={12} style={{ width: '100%' }}>
            <Typography.Text type="secondary">{t('pic115.setting.loginHint')}</Typography.Text>
            <Login />
          </Space>
        )}
      </Skeleton>
    </PageCard>
  );
}

export default SettingConfig115App;
