export type Cloud115AppType = 'web' | 'android' | 'ios' | 'tv';

export type RandomPicMode = 'direct' | 'json' | undefined;

export interface RandomPicMeta {
  url: string;
  fileName: string;
}

export interface Cloud115DbFileItem {
  pc: string;
  name: string;
  class: string;
}
