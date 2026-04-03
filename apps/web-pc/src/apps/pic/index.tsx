import { useEffect, useState } from 'react';
import { Button, Empty, Image, Space, Toast } from '@douyinfe/semi-ui';
import styles from './index.module.scss';
import { get115Pic, get115UserInfo } from '@/services/115';
import { useNavigate } from 'react-router';
import { Loading } from '@/components';
import { getCurrentUser } from '@/services/user';
import { AppFeature, UserRole } from '@volix/types';

type PicViewStatus = 'ready' | 'need-login-can-config' | 'need-login-no-permission' | 'error';

function PicApp() {
  const navigate = useNavigate();
  const [src, setSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<PicViewStatus>('ready');

  const fetchImg = async () => {
    try {
      setLoading(true);
      const [currentUserRes, userRes] = await Promise.all([getCurrentUser(), get115UserInfo()]);
      const currentUser = currentUserRes.data;
      const canConfig115 = currentUser?.role === UserRole.ADMIN;
      const has115Feature = Boolean(currentUser?.featurePermissions?.includes(AppFeature.ACCOUNT_115));
      const loggedIn = userRes.code === 0 && Boolean(userRes.data);
      if (!loggedIn) {
        setStatus(canConfig115 ? 'need-login-can-config' : 'need-login-no-permission');
        if (!has115Feature) {
          Toast.warning('当前账号暂无随机图片权限');
        } else if (canConfig115) {
          Toast.warning('请先登录 115 账号');
        } else {
          Toast.warning('当前账号无 115 配置权限，请联系管理员配置');
        }
        return;
      }

      const res = await get115Pic('json');
      if (res && res.data?.url) {
        setSrc(res.data.url);
        setStatus('ready');
        return;
      }
      setStatus(canConfig115 ? 'need-login-can-config' : 'need-login-no-permission');
      Toast.warning('未获取到随机图片，请先配置 115 图片目录');
    } catch {
      setStatus('error');
      Toast.error('获取随机图片失败，请先确认 115 登录与配置');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImg();
  }, [navigate]);

  if (loading) {
    return <Loading type="page" text="正在检查 115 登录状态..." />;
  }

  if (status === 'need-login-can-config') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Empty
          title="请先登录并配置 115"
          description="检测到当前账号可配置 115，请先前往账号配置完成登录或目录配置。"
        >
          <Space>
            <Button type="primary" onClick={() => navigate('/setting/config/115')}>
              前往 115 配置
            </Button>
            <Button onClick={fetchImg}>重新检测</Button>
          </Space>
        </Empty>
      </div>
    );
  }

  if (status === 'need-login-no-permission') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Empty
          title="当前账号无法配置 115"
          description="请联系管理员在后台完成 115 配置后再回来查看随机图片。"
        >
          <Space>
            <Button type="primary" onClick={() => navigate('/')}>
              返回首页
            </Button>
            <Button onClick={fetchImg}>重新检测</Button>
          </Space>
        </Empty>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Empty title="加载失败" description="随机图片加载失败，请稍后重试。">
          <Button type="primary" onClick={fetchImg}>
            重试
          </Button>
        </Empty>
      </div>
    );
  }

  return src ? (
    <Image
      setDownloadName={() => {
        return Date.now().toString();
      }}
      className={styles.full}
      src={src}
      preview={{
        onDownload: () => {
          const downloadLink = document.createElement('a');
          downloadLink.href = src;
          downloadLink.download = `${Date.now()}.png`;
          downloadLink.style.display = 'none';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        },
      }}
    />
  ) : (
    <Loading type="page" text="正在加载随机图片..." />
  );
}

export default PicApp;
