import { ModalHookType } from '@/hooks';
import { set115PicInfo } from '@/services/115';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Modal, Form, Input, Button, Radio, message } from 'antd';
import { useEffect, useState } from 'react';

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 4 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 20 },
  },
};

const formItemLayoutWithOutLabel = {
  wrapperCol: {
    xs: { span: 24, offset: 0 },
    sm: { span: 20, offset: 4 },
  },
};

interface StartModalProps extends ModalHookType {
  visible: boolean;
  reload?: () => void;
}

function StartModal(props: StartModalProps) {
  const { visible, closeModal, reload, data } = props;
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const submit = async () => {
    try {
      const formValue = await form.validateFields();
      setLoading(true);
      await set115PicInfo(formValue);
      setLoading(false);
      message.success('提交成功');
      localStorage.removeItem('config-115-modal');
      form.resetFields();
      reload?.();
      closeModal();
    } finally {
      setLoading(false);
    }
  };

  const save = () => {
    const values = form.getFieldsValue();
    localStorage.setItem('config-115-modal', JSON.stringify(values));
    message.success('已保存');
    closeModal();
  };

  useEffect(() => {
    if (visible) {
      const value = localStorage.getItem('config-115-modal');
      if (value) {
        form.setFieldsValue(JSON.parse(value));
      }
    }
  }, [visible]);

  return (
    <Modal
      confirmLoading={loading}
      onOk={submit}
      title="开始缓存"
      open={visible}
      onCancel={closeModal}
      footer={(_, { CancelBtn, OkBtn }) => {
        return (
          <>
            <CancelBtn />
            <Button onClick={save}>暂存</Button>
            <OkBtn />
          </>
        );
      }}
    >
      <Form form={form} {...formItemLayoutWithOutLabel}>
        <Form.Item
          initialValue={'cover'}
          label="缓存方式"
          name="type"
          rules={[{ required: true, message: '请选择缓存方式' }]}
        >
          <Radio.Group
            options={[
              { value: 'cover', label: '覆盖缓存' },
              { value: 'delete', label: '删除并缓存' },
            ]}
          />
        </Form.Item>
        <Form.List
          name="paths"
          initialValue={data?.paths || []}
          rules={[
            {
              validator: async (_, paths) => {
                if (!paths || paths.length === 0) {
                  return Promise.reject(new Error('至少添加1条路径'));
                }
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map((field, index) => {
                return (
                  <Form.Item
                    {...(index === 0 ? formItemLayout : formItemLayoutWithOutLabel)}
                    label={index === 0 ? '路径CID' : ''}
                    required
                    key={field.key}
                  >
                    <Form.Item
                      noStyle
                      name={field.name}
                      rules={[{ required: true, whitespace: true, message: '请输入路径CID' }]}
                      isListField
                    >
                      <Input placeholder="请输入路径CID" style={{ width: '80%' }} />
                    </Form.Item>
                    {fields.length > 1 ? (
                      <MinusCircleOutlined style={{ marginLeft: 6 }} onClick={() => remove(field.name)} />
                    ) : null}
                  </Form.Item>
                );
              })}
              <Form.Item>
                <Button type="dashed" style={{ width: '80%' }} onClick={() => add()} icon={<PlusOutlined />}>
                  添加路径
                </Button>
                <Form.ErrorList errors={errors} />
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}
export default StartModal;
