import { get115FileList } from '@/services/115';
import { Breadcrumb, BreadcrumbProps, Typography } from 'antd';
import { useEffect, useState } from 'react';

interface CidPathProps {
  cid: string;
}
const { Text } = Typography;
// 根据cid显示路径
function CidPath(props: CidPathProps) {
  const { cid } = props;

  const [items, setItems] = useState<BreadcrumbProps['items']>([]);

  useEffect(() => {
    if (!cid) {
      return;
    }

    get115FileList({ cid: cid }).then(res => {
      const result = res.data?.data?.path;
      const items = result?.map((item: any) => ({
        title: <Text type="secondary">{item.name}</Text>,
      }));
      setItems(items);
    });
  }, [cid]);

  return <Breadcrumb items={items} />;
}
export default CidPath;
