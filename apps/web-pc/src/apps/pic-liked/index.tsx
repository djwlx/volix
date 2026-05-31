import { useEffect, useMemo, useState } from 'react';
import { IconHeartStroked, IconInfoCircle } from '@douyinfe/semi-icons';
import { Button, Empty, ImagePreview, Toast, Tooltip } from '@douyinfe/semi-ui';
import type { Liked115PicItem } from '@volix/types';
import { get115LikedPics, like115Pic } from '@/services/115';
import { Loading } from '@/components';
import { getHttpErrorMessage } from '@/utils/error';
import styles from './index.module.scss';

interface LikedPicCard extends Liked115PicItem {}

const LIST_WEBP_WIDTH = 420;
const LIST_WEBP_QUALITY = 72;

const appendWebpFormat = (rawUrl: string) => {
  const safeUrl = String(rawUrl || '').trim();
  if (!safeUrl) {
    return '';
  }
  const [beforeHash, hashPart] = safeUrl.split('#', 2);
  const [pathPart, queryPart = ''] = beforeHash.split('?', 2);
  const params = new URLSearchParams(queryPart);
  params.set('format', 'webp');
  params.set('w', String(LIST_WEBP_WIDTH));
  params.set('q', String(LIST_WEBP_QUALITY));
  const query = params.toString();
  const withQuery = query ? `${pathPart}?${query}` : pathPart;
  return hashPart ? `${withQuery}#${hashPart}` : withQuery;
};

function PicLikedApp() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<LikedPicCard[]>([]);
  const [failedPcSet, setFailedPcSet] = useState<Set<string>>(new Set());
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const previewSrcList = useMemo(() => list.map(item => item.url).filter(Boolean), [list]);
  const previewIndexByPc = useMemo(() => {
    const mapping = new Map<string, number>();
    let index = 0;
    for (const item of list) {
      if (item.url) {
        mapping.set(item.pc, index);
        index += 1;
      }
    }
    return mapping;
  }, [list]);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await get115LikedPics({
        offset: 0,
        pageSize: 100,
      });
      const likedList = res.data.data || [];

      setList(likedList as LikedPicCard[]);
      setFailedPcSet(new Set());
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '加载我的喜欢失败'));
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const onUnlike = async (pc: string) => {
    try {
      await like115Pic({
        pc,
        liked: false,
      });
      setList(prev => prev.filter(item => item.pc !== pc));
      Toast.success('已取消喜欢');
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '取消喜欢失败'));
    }
  };

  useEffect(() => {
    refresh().catch(() => undefined);
  }, []);

  if (loading) {
    return <Loading type="page" />;
  }

  return (
    <div className={styles.page}>
      {list.length === 0 ? (
        <Empty title="还没有喜欢的图片" description="在随机图片页点击喜欢后，会出现在这里。" />
      ) : (
        <div className={styles.wall}>
          {list.map(item => (
            <div key={item.pc} className={styles.wallItem}>
              <div
                className={styles.wallImageWrap}
                onClick={() => {
                  if (!item.url) {
                    return;
                  }
                  const nextIndex = previewIndexByPc.get(item.pc);
                  setPreviewIndex(typeof nextIndex === 'number' ? nextIndex : 0);
                  setPreviewVisible(true);
                }}
              >
                {item.url ? (
                  failedPcSet.has(item.pc) ? (
                    <div className={styles.wallPlaceholder}>加载失败</div>
                  ) : (
                    <img
                      className={styles.wallImageEl}
                      src={appendWebpFormat(item.url)}
                      alt={item.fileName || item.pc}
                      decoding="async"
                      draggable={false}
                      onError={() => {
                        setFailedPcSet(prev => {
                          if (prev.has(item.pc)) {
                            return prev;
                          }
                          const next = new Set(prev);
                          next.add(item.pc);
                          return next;
                        });
                      }}
                    />
                  )
                ) : (
                  <div className={styles.wallPlaceholder}>缓存中...</div>
                )}
                <div className={styles.overlayActions}>
                  <Tooltip
                    content={<div className={styles.pathTooltip}>{item.path || item.fileName || item.pc}</div>}
                    position="leftTop"
                  >
                    <Button
                      theme="borderless"
                      className={styles.overlayIconBtn}
                      icon={<IconInfoCircle />}
                      aria-label="查看路径"
                      onClick={event => {
                        event.stopPropagation();
                      }}
                    />
                  </Tooltip>
                  <Button
                    theme="borderless"
                    type="danger"
                    className={styles.overlayIconBtn}
                    icon={<IconHeartStroked />}
                    aria-label="取消喜欢"
                    onClick={event => {
                      event.stopPropagation();
                      void onUnlike(item.pc);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ImagePreview
        src={previewSrcList}
        visible={previewVisible}
        currentIndex={previewIndex}
        onChange={index => setPreviewIndex(index)}
        onVisibleChange={visible => setPreviewVisible(Boolean(visible))}
      />
    </div>
  );
}

export default PicLikedApp;
