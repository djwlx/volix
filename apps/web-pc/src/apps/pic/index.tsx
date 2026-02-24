import { useEffect, useState } from 'react';
import { Image } from '@douyinfe/semi-ui';
import styles from './index.module.scss';
import { get115Pic } from '@/services/115';

function PicApp() {
  const [src, setSrc] = useState<string>('');

  const fetchImg = async () => {
    const res = await get115Pic('json');
    if (res && res.data?.url) {
      setSrc(res.data.url);
    }
  };

  useEffect(() => {
    fetchImg();
  }, []);

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
  ) : null;
}

export default PicApp;
