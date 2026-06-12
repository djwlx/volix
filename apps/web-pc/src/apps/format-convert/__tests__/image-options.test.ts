import { describe, expect, it } from 'vitest';
import { buildImageFormatOptions, buildImageTargetFileName, createImageConvertDraft } from '../image-options';

describe('image options', () => {
  it('creates draft defaulting to webp quality 82', () => {
    const draft = createImageConvertDraft();
    expect(draft.option.outputFormat).toBe('webp');
    expect(draft.option.quality).toBe(82);
  });

  it('lists four image formats', () => {
    expect(buildImageFormatOptions().map(item => item.value)).toEqual(['jpeg', 'png', 'webp', 'avif']);
  });

  it('builds target filename with jpg extension for jpeg', () => {
    expect(buildImageTargetFileName('photo.heic', 'jpeg')).toBe('photo.jpg');
    expect(buildImageTargetFileName('photo.heic', 'webp')).toBe('photo.webp');
  });
});
