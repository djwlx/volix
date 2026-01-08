import HomeApp from '@/apps/home';
import { createBrowserRouter } from 'react-router';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomeApp />,
  },
]);
