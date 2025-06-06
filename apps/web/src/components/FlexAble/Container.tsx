import { Row, RowProps } from 'antd';
import { ReactNode } from 'react';

export interface FlexContainerProps extends RowProps {
  children: ReactNode;
}
export function FlexContainer(props: FlexContainerProps) {
  const { children, ...rest } = props;
  return (
    <Row gutter={[16, 16]} {...rest}>
      {children}
    </Row>
  );
}
