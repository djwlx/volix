import { describe, expect, it } from 'vitest';
import { buildFormatterPanelState } from './panel-state';

if (!('window' in globalThis)) {
  Object.assign(globalThis, { window: globalThis });
}

describe('buildFormatterPanelState', () => {
  it('returns idle state for blank input', () => {
    const state = buildFormatterPanelState('   ');

    expect(state.status).toBe('idle');
    expect(state.formatType).toBe(null);
    expect(state.outputMode).toBe('empty');
  });

  it('returns a json tree view model for json input', () => {
    const state = buildFormatterPanelState('{"name":"volix","count":2}');

    expect(state.status).toBe('ready');
    expect(state.formatType).toBe('json');
    expect(state.detailType).toBe('json');
    expect(state.sourceMode).toBe('direct');
    expect(state.outputMode).toBe('json-tree');
    expect(state.formatted).toContain('"name": "volix"');
  });

  it('keeps decoded base64 json in the json tree mode', () => {
    const state = buildFormatterPanelState('eyJuYW1lIjoidm9saXgiLCJhY3RpdmUiOnRydWV9');

    expect(state.status).toBe('ready');
    expect(state.formatType).toBe('base64');
    expect(state.detailType).toBe('json');
    expect(state.sourceMode).toBe('decoded-base64');
    expect(state.outputMode).toBe('json-tree');
    expect(state.formatted).toContain('"name": "volix"');
  });

  it('does not misread hex hash text as decoded base64', () => {
    const state = buildFormatterPanelState('066db3c3898be9fa36a3dbe85c39742ca3c8c752');

    expect(state.status).toBe('ready');
    expect(state.formatType).toBe('base64');
    expect(state.detailType).toBe('text');
    expect(state.sourceMode).toBe('encoded-base64');
    expect(state.formatted).toBe('MDY2ZGIzYzM4OThiZTlmYTM2YTNkYmU4NWMzOTc0MmNhM2M4Yzc1Mg==');
  });
});
