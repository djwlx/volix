import { Route, Routes } from 'react-router';
import { NotFound } from '@/components';
import JobMain from './pages/main';

function JobApp() {
  return (
    <Routes>
      <Route index element={<JobMain />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
export default JobApp;
