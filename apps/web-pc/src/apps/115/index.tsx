import { UserInfo } from './user-info';
import { PicSetting } from './pic-setting';
import { Button, Empty, Space, Skeleton } from '@douyinfe/semi-ui';
import { FileTree } from './file-tree';
import { useUserInfo } from './hooks/useUserInfo';
import { useNavigate } from 'react-router';
import { useI18n } from '@/i18n';

function My115App() {
  const { data, loading } = useUserInfo();
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div style={{ padding: 16 }}>
      <Skeleton placeholder={<Skeleton.Paragraph rows={6} />} loading={loading}>
        {data ? (
          <Space spacing="medium" vertical style={{ width: '100%' }}>
            <UserInfo info={data} />
            <PicSetting />
            <FileTree />
          </Space>
        ) : (
          <Empty
            title={t('pic115.empty.notLoggedIn.title')}
            description={t('pic115.empty.notLoggedIn.description')}
            style={{ marginTop: 60 }}
          >
            <Button type="primary" onClick={() => navigate('/setting/config/115')}>
              {t('pic115.action.goToConfig')}
            </Button>
          </Empty>
        )}
      </Skeleton>
    </div>
  );
}

export default My115App;
