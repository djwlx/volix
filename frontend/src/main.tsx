import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import AppRouter from '@/layouts/router';
import { AppConfigProvider } from '@/layouts/config';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={zhCN}>
      <AppConfigProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AppConfigProvider>
    </ConfigProvider>
  </StrictMode>,
);
