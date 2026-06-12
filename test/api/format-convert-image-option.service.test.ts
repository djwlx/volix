import { describe, expect, it } from 'vitest';
import {
  buildFormatConvertImageSummary,
  normalizeFormatConvertImageOption,
} from '../../apps/api/src/modules/format-convert/service/format-convert-image-option.service';

describe('format convert image option', () => {
  it('defaults format to webp and quality to 82', () => {
    const option = normalizeFormatConvertImageOption({});
    expect(option.outputFormat).toBe('webp');
    expect(option.quality).toBe(82);
    expect(option.width).toBeUndefined();
  });

  it('clamps quality into 1-100 and rejects unknown format', () => {
    expect(normalizeFormatConvertImageOption({ outputFormat: 'png', quality: 999 }).quality).toBe(100);
    expect(normalizeFormatConvertImageOption({ outputFormat: 'png', quality: 0 }).quality).toBe(1);
    expect(() => normalizeFormatConvertImageOption({ outputFormat: 'bmp' as never, quality: 80 })).toThrow();
  });

  it('keeps positive integer width and drops invalid width', () => {
    expect(normalizeFormatConvertImageOption({ outputFormat: 'webp', quality: 80, width: 1280 }).width).toBe(1280);
    expect(normalizeFormatConvertImageOption({ outputFormat: 'webp', quality: 80, width: 0 }).width).toBeUndefined();
  });

  it('builds summary from option', () => {
    expect(buildFormatConvertImageSummary({ outputFormat: 'avif', quality: 60, width: 800 })).toEqual({
      outputFormat: 'avif',
      quality: 60,
      width: 800,
    });
  });
});
