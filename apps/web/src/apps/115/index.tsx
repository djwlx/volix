import { Route, Routes } from 'react-router';
import App115 from './pages/main';
import { NotFound } from '@/components';

function Router115() {
  return (
    <Routes>
      <Route index element={<App115 />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
export default Router115;
