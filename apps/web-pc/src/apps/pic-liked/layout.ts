export const getLikedWallCompactThreshold = (isMobile: boolean) => {
  return isMobile ? 2 : 4;
};

export const shouldUseLikedWallCompactLayout = (itemCount: number, isMobile: boolean) => {
  return itemCount > 0 && itemCount <= getLikedWallCompactThreshold(isMobile);
};
