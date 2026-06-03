import type { ReactNode } from 'react';

export interface HeaderDropdownItem {
  key: string;
  label: string;
  icon?: ReactNode;
  type?: 'danger' | 'primary' | 'secondary' | 'tertiary' | 'warning';
  onClick: () => void;
}

interface BuildHeaderDropdownItemsParams {
  isMobile: boolean;
  authed: boolean;
  menuItems: HeaderDropdownItem[];
  localeItem: HeaderDropdownItem;
  themeItem: HeaderDropdownItem;
  loginItem: HeaderDropdownItem;
}

export const buildHeaderDropdownItems = ({
  isMobile,
  authed,
  menuItems,
  localeItem,
  themeItem,
  loginItem,
}: BuildHeaderDropdownItemsParams) => {
  const items: HeaderDropdownItem[] = [];

  if (isMobile) {
    items.push(localeItem, themeItem);
  }

  items.push(...menuItems);

  if (!authed) {
    items.push(loginItem);
  }

  return items;
};
