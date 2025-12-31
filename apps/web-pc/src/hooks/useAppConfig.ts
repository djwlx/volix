import { AppConfigContext } from '@/layouts/config';
import { useContext } from 'react';

export function useAppConfig() {
  const config = useContext(AppConfigContext);

  return {
    ...config,
  };
}
