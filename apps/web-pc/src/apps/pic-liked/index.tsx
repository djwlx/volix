import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconHeartStroked, IconInfoCircle } from '@douyinfe/semi-icons';
import { Button, Empty, ImagePreview, Skeleton, Toast, Tooltip } from '@douyinfe/semi-ui';
import type { Liked115PicItem } from '@volix/types';
import { get115LikedPics, like115Pic } from '@/services/115';
import { getHttpErrorMessage } from '@/utils/error';
import { useI18n } from '@/i18n';
import styles from './index.module.scss';

type LikedPicCard = Liked115PicItem;

interface LikedPicWallItemProps {
  item: LikedPicCard;
  failed: boolean;
  previewIndexByPc: Map<string, number>;
  onOpenPreview: (pc: string) => void;
  onUnlike: (pc: string) => void;
  onImageError: (pc: string) => void;
  loadingText: string;
  failedText: string;
  pathAriaLabel: string;
  unlikeAriaLabel: string;
}

const LIST_PAGE_SIZE = 40;
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

function LikedPicWallItem({
  item,
  failed,
  previewIndexByPc,
  onOpenPreview,
  onUnlike,
  onImageError,
  loadingText,
  failedText,
  pathAriaLabel,
  unlikeAriaLabel,
}: LikedPicWallItemProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [item.pc, item.url]);

  useEffect(() => {
    if (!item.url || shouldLoad) {
      return;
    }

    const target = wrapRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: '300px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [item.url, shouldLoad]);

  const canOpenPreview = Boolean(item.url) && !failed;
  const showSkeleton = Boolean(item.url) && !failed && (!shouldLoad || !loaded);
  const showFallbackText = !item.url || failed;
  const wrapClassName = `${styles.wallImageWrap}${
    showSkeleton || showFallbackText ? ` ${styles.wallImageWrapLoading}` : ''
  }`;

  return (
    <div className={styles.wallItem}>
      <div
        ref={wrapRef}
        className={wrapClassName}
        onClick={() => {
          if (!canOpenPreview) {
            return;
          }
          if (!previewIndexByPc.has(item.pc)) {
            return;
          }
          onOpenPreview(item.pc);
        }}
      >
        {item.url && !failed && shouldLoad ? (
          <img
            className={styles.wallImageEl}
            src={appendWebpFormat(item.url)}
            alt={item.fileName || item.pc}
            decoding="async"
            draggable={false}
            onLoad={() => setLoaded(true)}
            onError={() => onImageError(item.pc)}
          />
        ) : null}

        {showSkeleton ? (
          <div className={styles.wallSkeletonLayer}>
            <Skeleton.Image className={styles.wallSkeletonImage} />
          </div>
        ) : null}

        {showFallbackText ? <div className={styles.wallPlaceholder}>{failed ? failedText : loadingText}</div> : null}

        <div className={styles.overlayActions}>
          <Tooltip
            content={<div className={styles.pathTooltip}>{item.path || item.fileName || item.pc}</div>}
            position="leftTop"
          >
            <Button
              theme="borderless"
              className={styles.overlayIconBtn}
              icon={<IconInfoCircle />}
              aria-label={pathAriaLabel}
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
            aria-label={unlikeAriaLabel}
            onClick={event => {
              event.stopPropagation();
              onUnlike(item.pc);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function PicLikedApp() {
  const { t } = useI18n();
  const [list, setList] = useState<LikedPicCard[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failedPcSet, setFailedPcSet] = useState<Set<string>>(new Set());
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const loadingRef = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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

  const hasMore = list.length < total;

  const fetchPage = useCallback(async (nextOffset: number, append: boolean) => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    if (append) {
      setLoadingMore(true);
    }

    try {
      const res = await get115LikedPics({
        offset: nextOffset,
        pageSize: LIST_PAGE_SIZE,
      });

      const likedList = (res.data.data || []) as LikedPicCard[];
      const nextTotal = Math.max(0, Number(res.data.count || 0));
      const nextOffsetValue = nextOffset + likedList.length;

      setTotal(nextTotal);
      setOffset(nextOffsetValue);

      setList(prev => {
        if (!append) {
          return likedList;
        }
        if (likedList.length === 0) {
          return prev;
        }

        const existing = new Set(prev.map(item => item.pc));
        const merged = [...prev];
        for (const item of likedList) {
          if (!existing.has(item.pc)) {
            merged.push(item);
          }
        }
        return merged;
      });
    } catch (error) {
      Toast.error(
        getHttpErrorMessage(error, t(append ? 'picLiked.error.loadMoreFailed' : 'picLiked.error.loadFailed'))
      );
      if (!append) {
        setList([]);
        setTotal(0);
        setOffset(0);
      }
    } finally {
      loadingRef.current = false;
      setInitialLoading(false);
      if (append) {
        setLoadingMore(false);
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    setInitialLoading(true);
    setFailedPcSet(new Set());
    await fetchPage(0, false);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || initialLoading || loadingRef.current) {
      return;
    }

    await fetchPage(offset, true);
  }, [fetchPage, hasMore, initialLoading, offset]);

  const onUnlike = useCallback(
    async (pc: string) => {
      try {
        await like115Pic({
          pc,
          liked: false,
        });
        setList(prev => prev.filter(item => item.pc !== pc));
        setTotal(prev => Math.max(0, prev - 1));
        setFailedPcSet(prev => {
          if (!prev.has(pc)) {
            return prev;
          }
          const next = new Set(prev);
          next.delete(pc);
          return next;
        });
        Toast.success(t('picLiked.unlikeSuccess'));
      } catch (error) {
        Toast.error(getHttpErrorMessage(error, t('picLiked.error.unlikeFailed')));
      }
    },
    [t]
  );

  const onImageError = useCallback((pc: string) => {
    setFailedPcSet(prev => {
      if (prev.has(pc)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(pc);
      return next;
    });
  }, []);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  useEffect(() => {
    if (!hasMore || initialLoading) {
      return;
    }

    const target = loadMoreRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      {
        root: null,
        rootMargin: '500px 0px',
        threshold: 0,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, initialLoading, loadMore]);

  const openPreviewByPc = useCallback(
    (pc: string) => {
      const nextIndex = previewIndexByPc.get(pc);
      if (typeof nextIndex !== 'number') {
        return;
      }
      setPreviewIndex(nextIndex);
      setPreviewVisible(true);
    },
    [previewIndexByPc]
  );

  if (initialLoading && list.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.wall}>
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={`skeleton-${index}`} className={styles.wallItem}>
              <div className={styles.wallImageWrap}>
                <div className={styles.wallSkeletonLayer}>
                  <Skeleton.Image className={styles.wallSkeletonImage} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {list.length === 0 ? (
        <Empty title={t('picLiked.empty.title')} description={t('picLiked.empty.description')} />
      ) : (
        <>
          <div className={styles.wall}>
            {list.map(item => (
              <LikedPicWallItem
                key={item.pc}
                item={item}
                failed={failedPcSet.has(item.pc)}
                previewIndexByPc={previewIndexByPc}
                onOpenPreview={openPreviewByPc}
                onUnlike={pc => {
                  void onUnlike(pc);
                }}
                onImageError={onImageError}
                loadingText={t('picLiked.loading')}
                failedText={t('picLiked.loadFailed')}
                pathAriaLabel={t('picLiked.action.viewPath')}
                unlikeAriaLabel={t('picLiked.action.unlike')}
              />
            ))}
          </div>
          <div ref={loadMoreRef} className={styles.loadMoreSentinel} aria-hidden="true" />
          {loadingMore ? (
            <div className={styles.loadMoreSkeletons}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`append-skeleton-${index}`} className={styles.wallItem}>
                  <div className={styles.wallImageWrap}>
                    <div className={styles.wallSkeletonLayer}>
                      <Skeleton.Image className={styles.wallSkeletonImage} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </>
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
