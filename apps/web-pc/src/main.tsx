import 'reset-css/reset.css';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { router } from '@/layouts/router';
import { formatTime } from '@volix/utils';

formatTime();

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
