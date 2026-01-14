import { Skeleton } from '@douyinfe/semi-ui';

// interface LoadingProps {
//   type?: 'page';
// }

export function Loading() {
  return (
    <div style={{ padding: 16 }}>
      <Skeleton placeholder={<Skeleton.Paragraph rows={6} />} active></Skeleton>
    </div>
  );
}
