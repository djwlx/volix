import { useEffect, useState } from 'react';
import { Button, Image, Space, Toast } from '@douyinfe/semi-ui';
import styles from './index.module.scss';
import { get115Pic, like115Pic } from '@/services/115';
import { Loading } from '@/components';
import { getHttpErrorMessage } from '@/utils/error';

interface PicMeta {
  src: string;
  cid: string;
  pc: string;
}

function PicApp() {
  const [picMeta, setPicMeta] = useState<PicMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);

  const fetchImg = async () => {
    try {
      setLoading(true);
      const res = await get115Pic('json');
      if (res && res.data?.url) {
        setPicMeta({
          src: res.data.url,
          cid: res.data.cid,
          pc: res.data.pc,
        });
      } else {
        setPicMeta(null);
      }
    } catch {
      setPicMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const onLike = async () => {
    if (!picMeta) {
      return;
    }

    try {
      setLiking(true);
      await like115Pic({
        cid: picMeta.cid,
        pc: picMeta.pc,
      });
      Toast.success('已提高该目录的随机几率');
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '喜欢失败'));
    } finally {
      setLiking(false);
    }
  };

  useEffect(() => {
    fetchImg();
  }, []);

  if (loading) {
    return <Loading type="page" />;
  }

  return picMeta?.src ? (
    <div className={styles.page}>
      <Image
        setDownloadName={() => {
          return Date.now().toString();
        }}
        className={styles.full}
        src={picMeta.src}
        preview={{
          onDownload: () => {
            const downloadLink = document.createElement('a');
            downloadLink.href = picMeta.src;
            downloadLink.download = `${Date.now()}.png`;
            downloadLink.style.display = 'none';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
          },
        }}
      />
      <div className={styles.actions}>
        <Space>
          <Button theme="solid" type="tertiary" onClick={() => fetchImg()}>
            换一张
          </Button>
          <Button theme="solid" type="primary" loading={liking} onClick={onLike}>
            喜欢
          </Button>
        </Space>
      </div>
    </div>
  ) : (
    <Loading type="page" text="正在加载随机图片..." />
  );
}

export default PicApp;
