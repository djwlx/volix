import { Op } from 'sequelize';
import { UserRssFeedItemModel } from '../model/rss-feed-item.model';

const normalizeText = (value: string) => String(value || '').trim();

export const countUserRssFeedItemsByRoute = async (userId: string, route: string): Promise<number> => {
  const normalizedUserId = normalizeText(userId);
  const normalizedRoute = normalizeText(route);
  if (!normalizedUserId || !normalizedRoute) {
    return 0;
  }
  return UserRssFeedItemModel.count({
    where: {
      user_id: normalizedUserId,
      route: normalizedRoute,
    },
  });
};

export const trimUserRssFeedItemsByRoute = async (params: {
  userId: string;
  route: string;
  keepLatestItems: number;
}): Promise<{ removedCount: number; removedItemKeys: string[] }> => {
  const userId = normalizeText(params.userId);
  const route = normalizeText(params.route);
  const keepLatestItems = Math.max(0, Math.floor(Number(params.keepLatestItems || 0)));
  if (!userId || !route || keepLatestItems <= 0) {
    return {
      removedCount: 0,
      removedItemKeys: [],
    };
  }

  const staleRows = await UserRssFeedItemModel.findAll({
    attributes: ['id', 'item_key'],
    where: {
      user_id: userId,
      route,
    },
    order: [
      ['published_at', 'DESC'],
      ['updated_at', 'DESC'],
      ['id', 'DESC'],
    ],
    offset: keepLatestItems,
  });

  const staleIds = staleRows.map(item => Number(item.dataValues.id || 0)).filter(Boolean);
  const staleItemKeys = Array.from(
    new Set(staleRows.map(item => String(item.dataValues.item_key || '').trim()).filter(Boolean))
  );

  if (staleIds.length === 0) {
    return {
      removedCount: 0,
      removedItemKeys: [],
    };
  }

  await UserRssFeedItemModel.destroy({
    where: {
      id: {
        [Op.in]: staleIds,
      },
    },
  });

  return {
    removedCount: staleIds.length,
    removedItemKeys: staleItemKeys,
  };
};
