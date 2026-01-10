import { Card, Avatar } from '@douyinfe/semi-ui';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';

interface AppCardProps {
  title: string;
  icon?: string | ReactNode;
  link?: string;
}

const { Meta } = Card;
export function AppCard(props: AppCardProps) {
  const { title, icon, link } = props;
  const navigate = useNavigate();
  const onClick = () => {
    if (!link) {
      return;
    }
    navigate(link);
  };
  return (
    <div onClick={onClick}>
      <Card style={{ width: 220 }} shadows="hover">
        <Meta
          title={title}
          avatar={typeof icon === 'string' ? <Avatar alt={title} size="default" src={icon} /> : icon}
        />
      </Card>
    </div>
  );
}
