// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { attachLocalUploadBeforeUnloadGuard } from '../local-upload-before-unload';

describe('local upload beforeunload guard', () => {
  it('prevents page exit and sets a truthy returnValue', () => {
    const detach = attachLocalUploadBeforeUnloadGuard();

    const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    Object.defineProperty(event, 'returnValue', {
      configurable: true,
      writable: true,
      value: '',
    });

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(event.returnValue).toBe(true);

    detach();
  });
});
