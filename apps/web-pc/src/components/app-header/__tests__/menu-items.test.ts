import { describe, expect, it, vi } from 'vitest';
import { buildHeaderDropdownItems, type HeaderDropdownItem } from '../menu-items';

const createItem = (key: string): HeaderDropdownItem => ({
  key,
  label: key,
  onClick: vi.fn(),
});

describe('buildHeaderDropdownItems', () => {
  it('prepends locale and theme actions on mobile', () => {
    const items = buildHeaderDropdownItems({
      isMobile: true,
      authed: true,
      menuItems: [createItem('setting'), createItem('logout')],
      localeItem: createItem('locale'),
      themeItem: createItem('theme'),
      loginItem: createItem('login'),
    });

    expect(items.map(item => item.key)).toEqual(['locale', 'theme', 'setting', 'logout']);
  });

  it('keeps locale and theme actions out of desktop dropdown', () => {
    const items = buildHeaderDropdownItems({
      isMobile: false,
      authed: true,
      menuItems: [createItem('setting'), createItem('logout')],
      localeItem: createItem('locale'),
      themeItem: createItem('theme'),
      loginItem: createItem('login'),
    });

    expect(items.map(item => item.key)).toEqual(['setting', 'logout']);
  });

  it('adds login action for guests', () => {
    const items = buildHeaderDropdownItems({
      isMobile: true,
      authed: false,
      menuItems: [],
      localeItem: createItem('locale'),
      themeItem: createItem('theme'),
      loginItem: createItem('login'),
    });

    expect(items.map(item => item.key)).toEqual(['locale', 'theme', 'login']);
  });
});
