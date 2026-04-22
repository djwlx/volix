import { useEffect, useState } from 'react';
import { Button, Image, Space, Toast, Tooltip } from '@douyinfe/semi-ui';
import styles from './index.module.scss';
import { get115Pic, get115PicFromParent, like115Pic } from '@/services/115';
import { Loading } from '@/components';
import { getHttpErrorMessage } from '@/utils/error';
import { useUser } from '@/hooks';
import type { Random115PicResponse } from '@volix/types';
import { UserRole } from '@volix/types';

interface PicMeta {
  src: string;
  cid: string;
  pc: string;
  path: string;
  parentPath: string;
}

function PicApp() {
  const { user } = useUser(false);
  const [picMeta, setPicMeta] = useState<PicMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const isAdmin = user?.role === UserRole.ADMIN;

  const applyPicMeta = (data?: Random115PicResponse | null) => {
    if (data?.url) {
      setPicMeta({
        src: data.url,
        cid: data.cid,
        pc: data.pc,
        path: data.path || '',
        parentPath: data.parentPath || '',
      });

      if (data.notice) {
        Toast.info(data.notice);
      }
      return;
    }

    setPicMeta(null);
  };

  const fetchImg = async () => {
    try {
      setLoading(true);
      const res = await get115Pic('json');
      applyPicMeta(res.data);
    } catch {
      setPicMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchSiblingImg = async () => {
    if (!picMeta?.pc) {
      return;
    }

    try {
      setLoading(true);
      const res = await get115PicFromParent(picMeta.pc);
      applyPicMeta(res.data);
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '同文件夹随机失败'));
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
        <Space className={styles.actionButtons}>
          <Button theme="solid" type="tertiary" onClick={() => fetchImg()}>
            换一张
          </Button>
          <Tooltip content={isAdmin && picMeta.parentPath ? picMeta.parentPath : ''} position="top" trigger="hover">
            <span className={styles.tooltipTrigger}>
              <Button theme="solid" type="secondary" disabled={!picMeta.parentPath} onClick={() => fetchSiblingImg()}>
                同文件夹随机
              </Button>
            </span>
          </Tooltip>
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
