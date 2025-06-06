import { Col, ColProps } from 'antd';
import { ReactNode } from 'react';

export interface FlexItemProps extends ColProps {
  children: ReactNode;
}
export function FlexItem(props: FlexItemProps) {
  const { children, ...rest } = props;
  return (
    <Col
      xs={{ flex: '100%' }}
      sm={{ flex: '50%' }}
      md={{ flex: '50%' }}
      lg={{ flex: '25%' }}
      xl={{ flex: '20%' }}
      {...rest}
    >
      {children}
    </Col>
  );
}
