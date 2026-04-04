import { useEffect, useState } from 'react';
import { Image } from '@douyinfe/semi-ui';
import styles from './index.module.scss';
import { get115Pic } from '@/services/115';
import { Loading } from '@/components';

function PicApp() {
  const [src, setSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchImg = async () => {
    try {
      setLoading(true);
      const res = await get115Pic('json');
      if (res && res.data?.url) {
        setSrc(res.data.url);
      }
    } catch {
      // 失败时不显示任何提示
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImg();
  }, []);

  if (loading) {
    return <Loading type="page" />;
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
