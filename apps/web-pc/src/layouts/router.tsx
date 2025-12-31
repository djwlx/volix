import { Route, Routes } from 'react-router';
import Home from '@/apps/home';
import Router115 from '@/apps/115';
import Pic from '@/apps/pic';
import { NotFound } from '@/components';
import JobApp from '@/apps/job';

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/115/*" element={<Router115 />} />
      <Route path="/job/*" element={<JobApp />} />
      <Route path="/pic/*" element={<Pic />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
export default AppRouter;
