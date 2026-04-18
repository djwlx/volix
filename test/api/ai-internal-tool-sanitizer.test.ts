import { sanitizeInternalToolResult } from '../../apps/api/src/modules/ai/service/ai-internal-tool-sanitizer.service';

describe('ai internal tool sanitizer', () => {
  test('masks credential-like fields recursively', () => {
    const result = sanitizeInternalToolResult({
      username: 'admin',
      password: 'secret123',
      nested: {
        cookie: 'SID=abc',
        apiKey: 'sk-live-123',
      },
    });

    expect(result).toEqual({
      username: 'admin',
      password: '******',
      nested: {
        cookie: '******',
        apiKey: '******',
      },
    });
  });

  test('removes signed query parameters from URLs', () => {
    const result = sanitizeInternalToolResult({
      imageUrl: 'https://example.com/file.jpg?X-Amz-Signature=abc&X-Amz-Credential=cred&plain=1',
    });

    expect(result).toEqual({
      imageUrl: 'https://example.com/file.jpg?plain=1',
    });
  });
});
