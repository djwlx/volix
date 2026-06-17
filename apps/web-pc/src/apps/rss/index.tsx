import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Empty, Select, Toast } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router';
import { useIsMobile } from '@/hooks';
import { isAuthenticated } from '@/utils';
import { getHttpErrorMessage } from '@/utils/error';
import { useI18n } from '@/i18n';
import { formatFeedDate, parseFeed } from './feed-parser';
import { getRssFeed, getUserRssSetting, getUserRssSubscriptions } from '@/services/rss';
import type { RssReaderRawFeed, UserRssSubscriptionItem } from '@volix/types';
import { buildItemId, toTimestamp, type AggregatedItem } from './aggregate-utils';
import styles from './index.module.scss';

const FALLBACK_HOST = 'https://rsshub.app';

function RssApp() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const authed = isAuthenticated();

  const [loading, setLoading] = useState(false);
  const [host, setHost] = useState(FALLBACK_HOST);
  const [subscriptions, setSubscriptions] = useState<UserRssSubscriptionItem[]>([]);
  const [feedMap, setFeedMap] = useState<Record<string, RssReaderRawFeed>>({});
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [activeItemKey, setActiveItemKey] = useState('');
  const [mobileOpenedItemKey, setMobileOpenedItemKey] = useState('');

  const routeStates = useMemo(() => {
    return subscriptions.map(item => {
      const route = String(item.route || '').trim();
      return {
        route,
        routeName: String(item.name || route),
        feed: feedMap[route],
      };
    });
  }, [feedMap, subscriptions]);

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
      if (!filteredRouteSet.has(routeState.route) || !routeState.feed) {
        return;
      }

      try {
        const parsed = parseFeed(routeState.feed);
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
            fetchedAt: routeState.feed?.fetchedAt || '',
          });
        });
      } catch {
        // ignore invalid single feed
      }
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

  const loadPanel = useCallback(
    async (options?: { force?: boolean }) => {
      if (!authed) {
        setHost(FALLBACK_HOST);
        setSubscriptions([]);
        setFeedMap({});
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
          setFeedMap({});
          setActiveItemKey('');
          setMobileOpenedItemKey('');
          return;
        }

        const results = await Promise.all(
          nextSubscriptions.map(async subscription => {
            try {
              const res = await getRssFeed({
                route: subscription.route,
                force: Boolean(options?.force),
              });

              return {
                route: subscription.route,
                routeName: String(subscription.name || subscription.route),
                feed: res.data,
                errorMessage: '',
              };
            } catch (error) {
              return {
                route: subscription.route,
                routeName: String(subscription.name || subscription.route),
                feed: null,
                errorMessage: getHttpErrorMessage(error, ''),
              };
            }
          })
        );

        const nextFeedMap: Record<string, RssReaderRawFeed> = {};
        const failedRoutes: string[] = [];

        results.forEach(result => {
          if (result.feed) {
            nextFeedMap[result.route] = result.feed;
          }
          if (result.errorMessage) {
            failedRoutes.push(`${result.routeName}: ${result.errorMessage}`);
          }
        });

        setFeedMap(nextFeedMap);
        setActiveItemKey('');
        setMobileOpenedItemKey('');

        if (failedRoutes.length > 0) {
          Toast.warning(t('rss.partialLoadFailed', { routes: failedRoutes.slice(0, 2).join('; ') }));
        }
      } catch (error) {
        Toast.error(getHttpErrorMessage(error, t('rss.error.loadFailed')));
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

  const summaryText = t('rss.summary', {
    routeCount: filteredRoutes.length,
    itemCount: aggregatedItems.length,
  });

  const renderDetail = () => {
    if (!activeItem) {
      return <Empty title={t('rss.empty.content.title')} description={t('rss.empty.content.description')} />;
    }

    return (
      <div className={styles.detailWrap}>
        <div className={styles.feedTitle}>{activeItem.title}</div>
        <div className={styles.detailMeta}>
          {activeItem.routeName} · {activeItem.route}
        </div>
        <div className={styles.detailMeta}>
          {formatFeedDate(activeItem.publishedAt) || t('rss.time.unknown')}
          {activeItem.author ? ` · ${activeItem.author}` : ''}
          {activeItem.feedTitle ? ` · ${activeItem.feedTitle}` : ''}
        </div>
        {activeItem.guid ? <div className={styles.detailMeta}>GUID: {activeItem.guid}</div> : null}
        {activeItem.updated ? (
          <div className={styles.detailMeta}>
            {t('rss.meta.updatedAt', { value: formatFeedDate(activeItem.updated) })}
          </div>
        ) : null}
        {activeItem.category && activeItem.category.length > 0 ? (
          <div className={styles.detailMeta}>{t('rss.meta.category', { value: activeItem.category.join(' / ') })}</div>
        ) : null}
        {activeItem.doi ? <div className={styles.detailMeta}>DOI: {activeItem.doi}</div> : null}
        {typeof activeItem.comments === 'number' ||
        typeof activeItem.upvotes === 'number' ||
        typeof activeItem.downvotes === 'number' ? (
          <div className={styles.detailMeta}>
            {typeof activeItem.comments === 'number' ? t('rss.meta.comments', { count: activeItem.comments }) : ''}
            {typeof activeItem.upvotes === 'number'
              ? `${typeof activeItem.comments === 'number' ? ' · ' : ''}${t('rss.meta.upvotes', {
                  count: activeItem.upvotes,
                })}`
              : ''}
            {typeof activeItem.downvotes === 'number'
              ? `${typeof activeItem.comments === 'number' || typeof activeItem.upvotes === 'number' ? ' · ' : ''}${t(
                  'rss.meta.downvotes',
                  { count: activeItem.downvotes }
                )}`
              : ''}
          </div>
        ) : null}
        {activeItem.enclosureUrl ? (
          <div className={styles.detailMeta}>
            {t('rss.meta.enclosure', { type: activeItem.enclosureType || 'unknown' })}
            {typeof activeItem.enclosureLength === 'number' ? ` · ${activeItem.enclosureLength} bytes` : ''}
          </div>
        ) : null}
        <div className={styles.detailBody}>
          {activeItem.descriptionHtml ? (
            <div dangerouslySetInnerHTML={{ __html: activeItem.descriptionHtml }} />
          ) : (
            activeItem.description || t('rss.empty.description')
          )}
        </div>
        <div className={styles.detailActions}>
          {activeItem.link ? (
            <Button type="primary" theme="solid" onClick={() => window.open(activeItem.link, '_blank')}>
              {t('rss.action.openOriginal')}
            </Button>
          ) : null}
          {activeItem.enclosureUrl ? (
            <Button theme="light" onClick={() => window.open(activeItem.enclosureUrl, '_blank')}>
              {t('rss.action.openAttachment')}
            </Button>
          ) : null}
          <Button theme="borderless" onClick={() => navigate('/setting/config/rsshub')}>
            {t('rss.action.manageSubscriptions')}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      {!authed ? (
        <div className={styles.emptyWrap}>
          <Empty title={t('rss.empty.login.title')} description={t('rss.empty.login.description')} />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className={styles.emptyWrap}>
          <Empty title={t('rss.empty.subscription.title')} description={t('rss.empty.subscription.description')}>
            <Button type="primary" onClick={() => navigate('/setting/config/rsshub')}>
              {t('rss.action.goToSettings')}
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
                  {t('rss.action.refresh')}
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
                  placeholder={t('rss.filter.placeholder')}
                  onChange={value => {
                    if (Array.isArray(value)) {
                      setSelectedRoutes(value.map(item => String(item)));
                      return;
                    }
                    setSelectedRoutes(value ? [String(value)] : []);
                  }}
                />
              </div>

              <div className={styles.historyHint}>{summaryText}</div>

              <div className={styles.itemList}>
                {aggregatedItems.length > 0 ? (
                  aggregatedItems.map(item => {
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
                        <div className={styles.itemTitle}>
                          <span className={styles.itemTitleText}>{item.title}</span>
                          {item.resourcesLocalized ? (
                            <span className={styles.cachedBadge}>{t('rss.badge.cached')}</span>
                          ) : null}
                        </div>
                        <div className={styles.itemMeta}>
                          {formatFeedDate(item.publishedAt) || t('rss.time.unknown')}
                        </div>
                        <div className={styles.itemSource}>{item.routeName}</div>
                      </button>
                    );
                  })
                ) : (
                  <Empty title={t('rss.empty.filtered.title')} description={t('rss.empty.filtered.description')} />
                )}
              </div>
            </div>
          ) : null}

          {isMobile ? (
            mobileOpenedItemKey ? (
              <div className={styles.mobileDetailPane}>
                <div className={styles.mobileDetailHeader}>
                  <Button theme="borderless" onClick={() => setMobileOpenedItemKey('')}>
                    {t('rss.action.backToList')}
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
