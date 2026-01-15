import { IconDelete, IconMinusCircle, IconPlus } from '@douyinfe/semi-icons';
import { Button, Card, Descriptions, Space, Modal, Tag, Form, ArrayField } from '@douyinfe/semi-ui';
import { FilePath } from './components';
import { useEffect, useMemo, useState } from 'react';
import type { Data } from '@douyinfe/semi-ui/lib/es/descriptions';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';

export function PicSetting() {
  const [count, setCount] = useState(0);
  const [isCaching, setIsCaching] = useState(false);
  const [paths, setPaths] = useState(['/asdf/vdfsdf/sdfsdfs', '/dsdfs/dsfssf/sdfsdf/sdfs']);
  const [form, setForm] = useState<FormApi>();

  useEffect(() => {}, []);

  const onSubmit = () => {
    console.log(form?.getValues(), 'values');
  };

  const data: Data[] = useMemo(() => {
    const base = [
      { key: '缓存数量', value: count },
      {
        key: '状态',
        value: (
          <Tag size="small" shape="circle" color="amber">
            缓存中
          </Tag>
        ),
      },
    ];

    if (paths.length) {
      base.push(
        ...paths.map((item, index) => {
          return {
            key: index === 0 ? '文件夹' : '',
            value: <>{item}</>,
          };
        })
      );
    }
    return base;
  }, [count, isCaching, paths]);

  return (
    <Card style={{ width: '100%' }} shadows="hover">
      <div style={{ display: 'flex', alignItems: 'start' }}>
        <Descriptions data={data} style={{ flex: 1 }} />
        <Space>
          <Button icon={<IconPlus />} aria-label="下一张" />
          <Button icon={<IconDelete style={{ color: 'red' }} />} aria-label="喜欢" />
        </Space>
      </div>
      <Modal onOk={onSubmit} title="开始缓存" visible centered>
        <div style={{ fontWeight: 500 }}>请填写文件夹cid</div>
        <Form getFormApi={setForm} allowEmpty>
          <ArrayField field="paths" initValue={[{ name: '' }]}>
            {({ add, arrayFields }) => {
              return (
                <>
                  {arrayFields.map(({ field, key, remove }, index) => {
                    return (
                      <div style={{ display: 'flex' }} key={key}>
                        <Form.Input fieldStyle={{ flex: 1 }} field={`${field}[path]`} noLabel />
                        {index !== 0 ? (
                          <Button
                            type="danger"
                            theme="borderless"
                            icon={<IconMinusCircle />}
                            onClick={remove}
                            style={{ margin: 12 }}
                          />
                        ) : (
                          <div style={{ width: 32, height: 32, margin: 12 }} />
                        )}
                      </div>
                    );
                  })}
                  <Button onClick={add}>新增</Button>
                </>
              );
            }}
          </ArrayField>
        </Form>
      </Modal>
    </Card>
  );
}
