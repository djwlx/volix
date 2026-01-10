import { createBrowserRouter } from 'react-router';
import HomeApp from '@/apps/home';
import My115App from '@/apps/115';
import PicApp from '@/apps/pic';

export const router = createBrowserRouter([
  {
    path: '/',
    children: [
      { index: true, Component: HomeApp },
      {
        path: '115',
        Component: My115App,
      },
      {
        path: 'pic',
        Component: PicApp,
      },
    ],
  },
]);
