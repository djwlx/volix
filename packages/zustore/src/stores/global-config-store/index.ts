import { create } from 'zustand';

interface ConfigInfo {
  theme: 'light' | 'dark';
}

interface GlobalConfigState {
  config: ConfigInfo;
  setConfig: (config: ConfigInfo) => void;
}

export const useGlobalConfigStore = create<GlobalConfigState>(set => ({
  config: {
    theme: 'light',
  },
  setConfig: config => set(state => ({ config: { ...state.config, ...config } })),
}));
