import { Route, Routes } from 'react-router';
import { NotFound } from '@/components';
import RandowPic from './pages/random';

function AppPic() {
  return (
    <Routes>
      <Route path="/random" element={<RandowPic />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
export default AppPic;
