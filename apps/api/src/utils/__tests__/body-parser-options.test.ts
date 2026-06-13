import { describe, expect, it } from 'vitest';

describe('body parser options', () => {
  it('raises multipart upload max file size to 1GB', async () => {
    const { getKoaBodyOptions } = await import('../body-parser-options.js');

    expect(getKoaBodyOptions()).toEqual({
      multipart: true,
      formidable: {
        maxFileSize: 1024 * 1024 * 1024,
      },
    });
  });
});
