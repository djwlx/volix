import { createContext, useState } from 'react';

// 全局配置
interface AppConfig {
  env: ImportMetaEnv;
  isProd: ImportMetaEnv['PROD'];
}

export const AppConfigContext = createContext<AppConfig | undefined>(undefined);

interface AppConfigProviderProps {
  children: React.ReactNode;
}
export function AppConfigProvider(props: AppConfigProviderProps) {
  const { children } = props;
  const [env] = useState(import.meta.env);
  return <AppConfigContext.Provider value={{ env, isProd: env.PROD }}>{children}</AppConfigContext.Provider>;
}
