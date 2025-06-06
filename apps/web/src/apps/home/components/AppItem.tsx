import { FlexItem } from '@/components';
import { Avatar, Card } from 'antd';
import { useNavigate } from 'react-router';

interface AppItemProps {
  title: string;
  iconUrl?: string;
  description?: string;
  path?: string;
}

const { Meta } = Card;

export default function AppItem(props: AppItemProps) {
  const { title, iconUrl, description, path } = props;

  const navigate = useNavigate();

  return (
    <FlexItem>
      <Card
        hoverable
        onClick={() => {
          if (path) {
            navigate(path);
          }
        }}
      >
        <Meta
          avatar={iconUrl ? <Avatar src={iconUrl} /> : <Avatar>{title.substring(0, 1)}</Avatar>}
          title={title}
          description={description ?? '...'}
        />
      </Card>
    </FlexItem>
  );
}
