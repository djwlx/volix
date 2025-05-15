import { FlexContainer } from '@/components';
import AppItem from './components/AppItem';

function Home() {
  return (
    <FlexContainer>
      <AppItem path="/115" title="我的115" description="115应用设置" />
      <AppItem path="/job" title="自动任务" description="自动任务" />
    </FlexContainer>
  );
}
export default Home;
