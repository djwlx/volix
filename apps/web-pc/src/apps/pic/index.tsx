import { useEffect, useState } from 'react';
import { Image } from '@douyinfe/semi-ui';
import styles from './index.module.scss';

function PicApp() {
  const [src, setSrc] = useState<string>('');

  const fetchImg = async () => {
    const res = await fetch('/api/115/pic?mode=direct');
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    setSrc(objectUrl);
  };

  useEffect(() => {
    fetchImg();
    return () => {
      if (src) {
        URL.revokeObjectURL(src);
      }
    };
  }, []);

  return src ? (
    <Image
      setDownloadName={() => {
        return Date.now().toString();
      }}
      className={styles.full}
      src={src}
    />
  ) : null;
}

export default PicApp;
