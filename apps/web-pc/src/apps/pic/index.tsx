import { useEffect, useState } from 'react';
import { Button, Image, Space, Toast, Tooltip } from '@douyinfe/semi-ui';
import styles from './index.module.scss';
import { get115FileList, get115Pic, get115PicFromParent, get115PicPathByPc, like115Pic } from '@/services/115';
import { Loading } from '@/components';
import { getHttpErrorMessage } from '@/utils/error';
import { useUser } from '@/hooks';
import { useI18n } from '@/i18n';
import type { Random115PicResponse } from '@volix/types';
import { UserRole } from '@volix/types';

interface PicMeta {
  src: string;
  cid: string;
  pc: string;
  fileName: string;
  liked: boolean;
  remoteSource: boolean;
}

function PicApp() {
  const { t } = useI18n();
  const { user } = useUser(false);
  const [picMeta, setPicMeta] = useState<PicMeta | null>(null);
  const [picPath, setPicPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const isAdmin = user?.role === UserRole.ADMIN;

  const applyPicMeta = (data?: Random115PicResponse | null) => {
    if (data?.url) {
      setPicMeta({
        src: data.url,
        cid: data.cid,
        pc: data.pc,
        fileName: data.fileName || '',
        liked: Boolean(data.liked),
        remoteSource: Boolean(data.remoteSource),
      });
      setPicPath(data.path || '');

      if (data.notice) {
        Toast.info(data.notice);
      }
      return;
    }

    setPicMeta(null);
    setPicPath('');
  };

  const resolveFilePath = async (meta: Pick<PicMeta, 'pc' | 'cid' | 'fileName'>) => {
    const { pc, cid, fileName } = meta;
    if (!pc) {
      return {
        path: '',
        liked: false,
      };
    }

    try {
      const res = await get115PicPathByPc(pc);
      const resolvedPath = String(res.data.path || '').trim();
      const liked = Boolean(res.data.liked);
      if (resolvedPath) {
        return {
          path: resolvedPath,
          liked,
        };
      }

      // Fallback for old cache rows without stored full_path.
      const folderRes = await get115FileList({
        cid,
        offset: 0,
        pageSize: 1,
      });
      const folderPath = `/${(folderRes.data.path || [])
        .map(item => item.name)
        .filter(Boolean)
        .join('/')}`.replace(/\/+/g, '/');
      const fallbackPath =
        folderPath && folderPath !== '/' ? `${folderPath}/${fileName || ''}`.replace(/\/+/g, '/') : fileName || '';
      return {
        path: fallbackPath,
        liked,
      };
    } catch {
      // ignore path resolve error
      return {
        path: '',
        liked: false,
      };
    }
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
      Toast.error(getHttpErrorMessage(error, t('pic.error.fetchSiblingFailed')));
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
      const result = await like115Pic({
        cid: picMeta.cid,
        pc: picMeta.pc,
      });
      const liked = Boolean(result.data?.liked);
      setPicMeta(prev => (prev ? { ...prev, liked } : prev));
      Toast.success(t(liked ? 'pic.like.added' : 'pic.like.removed'));
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('pic.error.likeFailed')));
    } finally {
      setLiking(false);
    }
  };

  useEffect(() => {
    fetchImg();
  }, []);

  useEffect(() => {
    if (!isAdmin || !picMeta?.pc || picPath) {
      return;
    }

    let cancelled = false;

    resolveFilePath({
      pc: picMeta.pc,
      cid: picMeta.cid,
      fileName: picMeta.fileName,
    }).then(result => {
      if (!cancelled) {
        setPicPath(result.path || '');
        setPicMeta(prev => (prev ? { ...prev, liked: result.liked } : prev));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, picMeta?.pc, picMeta?.cid, picMeta?.fileName, picPath]);

  if (loading) {
    return <Loading type="page" />;
  }

  const pathTooltipContent = isAdmin ? picPath : '';

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
            {t('pic.action.next')}
          </Button>
          {isAdmin && pathTooltipContent ? (
            <Tooltip content={pathTooltipContent} position="top" trigger="hover">
              <span className={styles.tooltipTrigger}>
                <Button theme="solid" type="secondary" disabled={!picMeta.pc} onClick={() => fetchSiblingImg()}>
                  {t('pic.action.randomSibling')}
                </Button>
              </span>
            </Tooltip>
          ) : (
            <span className={styles.tooltipTrigger}>
              <Button theme="solid" type="secondary" disabled={!picMeta.pc} onClick={() => fetchSiblingImg()}>
                {t('pic.action.randomSibling')}
              </Button>
            </span>
          )}
          {user && !picMeta.remoteSource ? (
            <Button theme="solid" type="primary" loading={liking} onClick={onLike}>
              {t(picMeta.liked ? 'pic.action.unlike' : 'pic.action.like')}
            </Button>
          ) : null}
        </Space>
      </div>
    </div>
  ) : (
    <Loading type="page" text={t('pic.loading')} />
  );
}

export default PicApp;
