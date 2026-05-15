import type { PicRandomCacheConfig } from '../../types/115.types';
import type { RandomLocalCacheItem } from './picture-cache-random-core';
import { clearRandomMemoryCacheByPc } from './picture-cache-random-core';

export { clearRandomMemoryCacheByPc };

// Random memory cache has been removed. Keep this as a no-op shim so
// existing call sites and API behavior remain backward compatible.
export const tryAddRandomMemoryCacheByLocalItem = async (
  _localItem: RandomLocalCacheItem,
  _config: PicRandomCacheConfig
) => {
  return;
};
