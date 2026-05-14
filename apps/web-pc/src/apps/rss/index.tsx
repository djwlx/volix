import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Empty, Select, Toast } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router';
import { useIsMobile } from '@/hooks';
import { isAuthenticated } from '@/utils';
import { getHttpErrorMessage } from '@/utils/error';
import { formatFeedDate, parseFeed } from './feed-parser';
import { getRssFeedHistory, getUserRssSetting, getUserRssSubscriptions } from '@/services/rss';
import type { UserRssSubscriptionItem } from '@volix/types';
import { buildItemId, toTimestamp, type AggregatedItem, type RouteHistoryState } from './aggregate-utils';
import styles from './index.module.scss';

const FALLBACK_HOST = 'https://rsshub.app';

function RssApp() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const authed = isAuthenticated();

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [host, setHost] = useState(FALLBACK_HOST);
  const [subscriptions, setSubscriptions] = useState<UserRssSubscriptionItem[]>([]);
  const [routeHistoryMap, setRouteHistoryMap] = useState<Record<string, RouteHistoryState>>({});
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [activeItemKey, setActiveItemKey] = useState('');
  const [mobileOpenedItemKey, setMobileOpenedItemKey] = useState('');

  const itemListRef = useRef<HTMLDivElement | null>(null);
  const nextLoadRouteIndexRef = useRef(0);

  const routeStates = useMemo(() => {
    return subscriptions.map(item => {
      const route = String(item.route || '').trim();
      const state = routeHistoryMap[route];
      return {
        route,
        routeName: String(item.name || route),
        state,
      };
    });
  }, [routeHistoryMap, subscriptions]);

  const routeFilterOptions = useMemo(() => {
    return routeStates.map(item => ({
      label: `${item.routeName} · ${item.route}`,
      value: item.route,
    }));
  }, [routeStates]);

  const filteredRoutes = useMemo(() => {
    if (selectedRoutes.length === 0) {
      return routeStates.map(item => item.route);
    }

    const selectedSet = new Set(selectedRoutes);
    return routeStates.filter(item => selectedSet.has(item.route)).map(item => item.route);
  }, [routeStates, selectedRoutes]);

  const filteredRouteSet = useMemo(() => new Set(filteredRoutes), [filteredRoutes]);

  const aggregatedItems = useMemo<AggregatedItem[]>(() => {
    const items: AggregatedItem[] = [];
    const keySet = new Set<string>();

    routeStates.forEach(routeState => {
      if (!filteredRouteSet.has(routeState.route)) {
        return;
      }

      if (!routeState.state?.pages?.length) {
        return;
      }

      routeState.state.pages.forEach(page => {
        try {
          const parsed = parseFeed(page);
          parsed.items.forEach(item => {
            const sourceId = buildItemId(item);
            const itemKey = `${routeState.route}::${sourceId}`;
            if (keySet.has(itemKey)) {
              return;
            }

            keySet.add(itemKey);
            items.push({
              ...item,
              itemKey,
              route: routeState.route,
              routeName: routeState.routeName,
              feedTitle: parsed.title,
              fetchedAt: page.fetchedAt,
            });
          });
        } catch {
          // ignore parse failure for invalid single page
        }
      });
    });

    items.sort((a, b) => {
      return toTimestamp(b.publishedAt, b.fetchedAt) - toTimestamp(a.publishedAt, a.fetchedAt);
    });

    return items;
  }, [filteredRouteSet, routeStates]);

  const activeItem = useMemo(() => {
    const targetItemKey = isMobile ? mobileOpenedItemKey : activeItemKey;
    if (!targetItemKey) {
      return aggregatedItems[0] || null;
    }

    return aggregatedItems.find(item => item.itemKey === targetItemKey) || aggregatedItems[0] || null;
  }, [activeItemKey, aggregatedItems, isMobile, mobileOpenedItemKey]);

  const canLoadMore = useMemo(() => {
    return filteredRoutes.some(route => {
      const state = routeHistoryMap[route];
      return Boolean(state?.hasMore && state.cursor);
    });
  }, [filteredRoutes, routeHistoryMap]);

  const pickNextRouteToLoad = useCallback(() => {
    const candidates = filteredRoutes.filter(route => {
      const state = routeHistoryMap[route];
      return Boolean(state?.hasMore && state.cursor);
    });

    if (candidates.length === 0) {
      return '';
    }

    const index = nextLoadRouteIndexRef.current % candidates.length;
    nextLoadRouteIndexRef.current = index + 1;
    return candidates[index] || '';
  }, [filteredRoutes, routeHistoryMap]);

  const loadMoreHistory = useCallback(async () => {
    if (historyLoading) {
      return;
    }

    const targetRoute = pickNextRouteToLoad();
    if (!targetRoute) {
      return;
    }

    const current = routeHistoryMap[targetRoute];
    if (!current?.cursor) {
      return;
    }

    setHistoryLoading(true);
    try {
      const res = await getRssFeedHistory({
        route: targetRoute,
        cursor: current.cursor,
      });

      const payload = res.data;
      setRouteHistoryMap(prev => ({
        ...prev,
        [targetRoute]: {
          ...prev[targetRoute],
          route: targetRoute,
          routeName: prev[targetRoute]?.routeName || targetRoute,
          pages: [...(prev[targetRoute]?.pages || []), payload.page],
          cursor: payload.nextCursor || '',
          hasMore: Boolean(payload.hasMore),
          mode: payload.mode,
          supportsUpstreamPagination: Boolean(payload.supportsUpstreamPagination),
        },
      }));
    } catch (error) {
      setRouteHistoryMap(prev => ({
        ...prev,
        [targetRoute]: {
          ...prev[targetRoute],
          route: targetRoute,
          routeName: prev[targetRoute]?.routeName || targetRoute,
          pages: prev[targetRoute]?.pages || [],
          cursor: '',
          hasMore: false,
          mode: prev[targetRoute]?.mode || 'none',
          supportsUpstreamPagination: Boolean(prev[targetRoute]?.supportsUpstreamPagination),
        },
      }));
      Toast.error(getHttpErrorMessage(error, `加载 ${targetRoute} 历史失败`));
    } finally {
      setHistoryLoading(false);
    }
  }, [historyLoading, pickNextRouteToLoad, routeHistoryMap]);

  const loadPanel = useCallback(
    async (options?: { force?: boolean }) => {
      if (!authed) {
        setHost(FALLBACK_HOST);
        setSubscriptions([]);
        setRouteHistoryMap({});
        setActiveItemKey('');
        setMobileOpenedItemKey('');
        return;
      }

      setLoading(true);
      try {
        const [settingRes, subscriptionsRes] = await Promise.all([getUserRssSetting(), getUserRssSubscriptions()]);
        const nextSubscriptions = subscriptionsRes.data || [];

        setHost(settingRes.data?.host || FALLBACK_HOST);
        setSubscriptions(nextSubscriptions);

        if (nextSubscriptions.length === 0) {
          setRouteHistoryMap({});
          setActiveItemKey('');
          setMobileOpenedItemKey('');
          return;
        }

        const results = await Promise.all(
          nextSubscriptions.map(async subscription => {
            try {
              const res = await getRssFeedHistory({
                route: subscription.route,
                force: Boolean(options?.force),
              });

              return {
                route: subscription.route,
                routeName: String(subscription.name || subscription.route),
                state: {
                  route: subscription.route,
                  routeName: String(subscription.name || subscription.route),
                  pages: [res.data.page],
                  cursor: res.data.nextCursor || '',
                  hasMore: Boolean(res.data.hasMore),
                  mode: res.data.mode,
                  supportsUpstreamPagination: Boolean(res.data.supportsUpstreamPagination),
                } as RouteHistoryState,
                errorMessage: '',
              };
            } catch (error) {
              return {
                route: subscription.route,
                routeName: String(subscription.name || subscription.route),
                state: {
                  route: subscription.route,
                  routeName: String(subscription.name || subscription.route),
                  pages: [],
                  cursor: '',
                  hasMore: false,
                  mode: 'none' as const,
                  supportsUpstreamPagination: false,
                },
                errorMessage: getHttpErrorMessage(error, ''),
              };
            }
          })
        );

        const nextMap: Record<string, RouteHistoryState> = {};
        const failedRoutes: string[] = [];

        results.forEach(result => {
          nextMap[result.route] = result.state;
          if (result.errorMessage) {
            failedRoutes.push(`${result.routeName}: ${result.errorMessage}`);
          }
        });

        setRouteHistoryMap(nextMap);
        setActiveItemKey('');
        setMobileOpenedItemKey('');

        if (failedRoutes.length > 0) {
          Toast.warning(`部分订阅加载失败：${failedRoutes.slice(0, 2).join('；')}`);
        }
      } catch (error) {
        Toast.error(getHttpErrorMessage(error, '加载 RSS 阅读器失败'));
      } finally {
        setLoading(false);
      }
    },
    [authed]
  );

  useEffect(() => {
    loadPanel().catch(() => undefined);
  }, [loadPanel]);

  useEffect(() => {
    if (selectedRoutes.length === 0) {
      return;
    }

    const allowed = new Set(routeStates.map(item => item.route));
    const nextSelected = selectedRoutes.filter(route => allowed.has(route));
    if (nextSelected.length !== selectedRoutes.length) {
      setSelectedRoutes(nextSelected);
    }
  }, [routeStates, selectedRoutes]);

  useEffect(() => {
    if (!activeItemKey && aggregatedItems[0]?.itemKey) {
      setActiveItemKey(aggregatedItems[0].itemKey);
    }
  }, [activeItemKey, aggregatedItems]);

  useEffect(() => {
    const container = itemListRef.current;
    if (!container || historyLoading || !canLoadMore) {
      return;
    }

    if (container.scrollHeight <= container.clientHeight + 48) {
      loadMoreHistory().catch(() => undefined);
    }
  }, [aggregatedItems.length, canLoadMore, historyLoading, loadMoreHistory]);

  const onScrollLoadMore = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const remain = target.scrollHeight - target.scrollTop - target.clientHeight;
      if (remain > 180 || historyLoading) {
        return;
      }
      loadMoreHistory().catch(() => undefined);
    },
    [historyLoading, loadMoreHistory]
  );

  const historyStatusText = canLoadMore
    ? `已聚合 ${filteredRoutes.length} 个订阅，滚动到底部会自动加载更多`
    : `已聚合 ${filteredRoutes.length} 个订阅，暂无更多历史`;

  const renderDetail = () => {
    if (!activeItem) {
      return <Empty title="暂无内容" description="请先检查订阅是否可用，或稍后刷新重试。" />;
    }

    return (
      <div className={styles.detailWrap}>
        <div className={styles.feedTitle}>{activeItem.title}</div>
        <div className={styles.detailMeta}>
          {activeItem.routeName} · {activeItem.route}
        </div>
        <div className={styles.detailMeta}>
          {formatFeedDate(activeItem.publishedAt) || '未知时间'}
          {activeItem.author ? ` · ${activeItem.author}` : ''}
          {activeItem.feedTitle ? ` · ${activeItem.feedTitle}` : ''}
        </div>
        <div className={styles.detailBody}>
          {activeItem.descriptionHtml ? (
            <div dangerouslySetInnerHTML={{ __html: activeItem.descriptionHtml }} />
          ) : (
            activeItem.description || '该条目没有摘要内容。'
          )}
        </div>
        <div className={styles.detailActions}>
          {activeItem.link ? (
            <Button type="primary" theme="solid" onClick={() => window.open(activeItem.link, '_blank')}>
              打开原文
            </Button>
          ) : null}
          <Button theme="borderless" onClick={() => navigate('/setting/config/rsshub')}>
            管理订阅
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      {!authed ? (
        <div className={styles.emptyWrap}>
          <Empty title="请先登录" description="登录后才可以读取你的 RSSHub 配置和订阅列表。" />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className={styles.emptyWrap}>
          <Empty title="还没有订阅" description="先去设置页添加 route，再来这里阅读。">
            <Button type="primary" onClick={() => navigate('/setting/config/rsshub')}>
              去配置 RSS
            </Button>
          </Empty>
        </div>
      ) : (
        <div className={styles.readerWrap}>
          {!isMobile || !mobileOpenedItemKey ? (
            <div className={styles.listPane}>
              <div className={styles.toolbar}>
                <div className={styles.hostText} title={host}>
                  Host: {host}
                </div>
                <Button size="small" theme="borderless" loading={loading} onClick={() => loadPanel({ force: true })}>
                  刷新
                </Button>
              </div>

              <div className={styles.filterRow}>
                <Select<string>
                  multiple
                  filter
                  showClear
                  maxTagCount={2}
                  optionList={routeFilterOptions}
                  value={selectedRoutes}
                  style={{ width: '100%' }}
                  placeholder="按订阅多选过滤（名称 / URL）"
                  onChange={value => {
                    if (Array.isArray(value)) {
                      setSelectedRoutes(value.map(item => String(item)));
                      return;
                    }
                    setSelectedRoutes(value ? [String(value)] : []);
                  }}
                />
              </div>

              <div className={styles.historyHint}>{historyStatusText}</div>

              <div className={styles.itemList} ref={itemListRef} onScroll={onScrollLoadMore}>
                {aggregatedItems.length > 0 ? (
                  <>
                    {aggregatedItems.map(item => {
                      const isCurrent = activeItem?.itemKey === item.itemKey;
                      return (
                        <button
                          key={item.itemKey}
                          type="button"
                          className={`${styles.itemCard} ${isCurrent ? styles.itemCardActive : ''}`}
                          onClick={() => {
                            setActiveItemKey(item.itemKey);
                            if (isMobile) {
                              setMobileOpenedItemKey(item.itemKey);
                            }
                          }}
                        >
                          <div className={styles.itemTitle}>{item.title}</div>
                          <div className={styles.itemMeta}>{formatFeedDate(item.publishedAt) || '未知时间'}</div>
                          <div className={styles.itemSource}>{item.routeName}</div>
                        </button>
                      );
                    })}

                    {historyLoading ? <div className={styles.historyEndText}>正在加载更多历史...</div> : null}
                    {!canLoadMore && !historyLoading ? (
                      <div className={styles.historyEndText}>已到底部，没有更多历史内容</div>
                    ) : null}
                  </>
                ) : (
                  <Empty title="没有匹配结果" description="可以调整过滤条件，或先去配置页检查订阅。" />
                )}
              </div>
            </div>
          ) : null}

          {isMobile ? (
            mobileOpenedItemKey ? (
              <div className={styles.mobileDetailPane}>
                <div className={styles.mobileDetailHeader}>
                  <Button theme="borderless" onClick={() => setMobileOpenedItemKey('')}>
                    返回列表
                  </Button>
                </div>
                {renderDetail()}
              </div>
            ) : null
          ) : (
            <div className={styles.detailPane}>{renderDetail()}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default RssApp;
