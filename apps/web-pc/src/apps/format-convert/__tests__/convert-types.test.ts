import { describe, expect, it } from 'vitest';
import { FormatConvertEngine } from '@volix/types';
import { getConvertType, listConvertTypes } from '../convert-types';

describe('convert types registry', () => {
  it('lists three convert types with the image one', () => {
    const ids = listConvertTypes().map(item => item.id);
    expect(ids).toEqual(['local-media', 'cloud-media', 'local-image']);
  });

  it('resolves local-image as image engine + local upload', () => {
    const type = getConvertType('local-image');
    expect(type?.engine).toBe(FormatConvertEngine.IMAGE);
    expect(type?.sourceKind).toBe('local-upload');
    expect(type?.uploadAccept).toBe('image/*');
  });
});
