import { describe, expect, it } from 'vitest';
import { FormatConvertEngine } from '@volix/types';
import { getConvertType, listConvertTypes } from '../convert-types';

describe('convert types registry', () => {
  it('lists four convert types with the comic one', () => {
    const ids = listConvertTypes().map(item => item.id);
    expect(ids).toEqual(['local-media', 'cloud-media', 'local-image', 'local-comic-metadata']);
  });

  it('resolves local-image as image engine + local upload', () => {
    const type = getConvertType('local-image');
    expect(type?.engine).toBe(FormatConvertEngine.IMAGE);
    expect(type?.sourceKind).toBe('local-upload');
    expect(type?.uploadAccept).toBe('image/*');
  });

  it('resolves local-comic-metadata as comic engine + local upload', () => {
    const type = getConvertType('local-comic-metadata');
    expect(type?.engine).toBe(FormatConvertEngine.COMIC);
    expect(type?.sourceKind).toBe('local-upload');
    expect(type?.uploadAccept).toContain('.cbz');
  });
});
