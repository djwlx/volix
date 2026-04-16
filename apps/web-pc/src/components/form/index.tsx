import { ArrayField, Form } from '@douyinfe/semi-ui';
import type { ComponentProps, JSX } from 'react';

type AppFormStatics = Pick<
  typeof Form,
  'Input' | 'Select' | 'Slot' | 'Radio' | 'RadioGroup' | 'Checkbox' | 'CheckboxGroup' | 'TextArea'
> & {
  ArrayField: typeof ArrayField;
};

type AppFormType = ((props: ComponentProps<typeof Form>) => JSX.Element) & AppFormStatics;

const AppFormImpl = ({ labelAlign = 'left', ...restProps }: ComponentProps<typeof Form>) => {
  const style = {
    width: '100%',
    ...(restProps.style || {}),
  };
  return <Form labelAlign={labelAlign} {...restProps} style={style} />;
};

export const AppForm = Object.assign(AppFormImpl, {
  Input: Form.Input,
  Select: Form.Select,
  Slot: Form.Slot,
  Radio: Form.Radio,
  RadioGroup: Form.RadioGroup,
  Checkbox: Form.Checkbox,
  CheckboxGroup: Form.CheckboxGroup,
  TextArea: Form.TextArea,
  ArrayField,
}) as AppFormType;
