import { IconDelete, IconMinusCircle, IconPlus } from '@douyinfe/semi-icons';
import { Button, Card, Descriptions, Space, Modal, Tag, Popconfirm, Toast } from '@douyinfe/semi-ui';
import { FilePath } from './components';
import { useEffect, useMemo, useState } from 'react';
import type { Data } from '@douyinfe/semi-ui/lib/es/descriptions';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import { clear115Pic, get115PicInfo, set115PicInfo } from '@/services/115';
import { useModal } from '@/hooks';
import { AppForm } from '@/components';

export function PicSetting() {
  const [count, setCount] = useState(0);
  const [isCaching, setIsCaching] = useState(false);
  const [paths, setPaths] = useState<string[]>([]);
  const [form, setForm] = useState<FormApi>();
  const { setModal, visible, closeModal } = useModal();

  const fetch = async () => {
    const result = await get115PicInfo();
    if (result.code === 0) {
      setCount(result.data.count);
      setIsCaching(result.data.loading);
      setPaths(result.data.paths);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const onSubmit = async () => {
    const values = await form?.validate();
    const pathsTemp = values?.paths?.map((item: { path: string }) => item.path);
    await set115PicInfo({
      paths: pathsTemp,
    });
    closeModal();
    fetch();
  };

  const onDelete = async () => {
    await clear115Pic();
    fetch();
    Toast.success('清理成功');
  };

  const onDeleteByPath = async (path: string) => {
    await clear115Pic({
      paths: [path],
    });
    fetch();
    Toast.success('删除成功');
  };

  const data: Data[] = useMemo(() => {
    const base = [
      { key: '缓存数量', value: count },
      {
        key: '状态',
        value: isCaching ? (
          <Tag size="small" shape="circle" color="amber">
            缓存中
          </Tag>
        ) : count ? (
          <Tag size="small" shape="circle" color="green">
            已缓存
          </Tag>
        ) : (
          <Tag size="small" shape="circle" color="orange">
            未缓存
          </Tag>
        ),
      },
    ];

    if (paths?.length) {
      base.push(
        ...paths.map((item, index) => {
          return {
            key: index === 0 ? '文件夹' : '',
            value: (
              <Space>
                <FilePath dir={item} />
                <Popconfirm
                  title="确定删除该路径缓存？"
                  content="此修改将不可逆"
                  onConfirm={() => onDeleteByPath(item)}
                >
                  <Button type="danger" theme="borderless" icon={<IconDelete />} aria-label={`删除路径 ${item}`} />
                </Popconfirm>
              </Space>
            ),
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
          <Button icon={<IconPlus />} aria-label="添加" onClick={() => setModal('open')} />
          <Popconfirm title="确定清理所有缓存？" content="此修改将不可逆" onConfirm={onDelete}>
            <Button icon={<IconDelete style={{ color: 'red' }} />} aria-label="清理" />
          </Popconfirm>
        </Space>
      </div>
      <Modal onCancel={closeModal} onOk={onSubmit} title="开始缓存" visible={visible} centered>
        <AppForm getFormApi={setForm} allowEmpty labelPosition="left">
          <AppForm.ArrayField field="paths" initValue={[{ path: '' }]}>
            {({
              add,
              arrayFields,
            }: {
              add: () => void;
              arrayFields: Array<{ field: string; key: string; remove: () => void }>;
            }) => {
              return (
                <>
                  {arrayFields.map(({ field, key, remove }, index: number) => {
                    return (
                      <div style={{ display: 'flex' }} key={key}>
                        <AppForm.Input
                          label={index === 0 ? '文件夹 CID' : ' '}
                          rules={[
                            {
                              required: true,
                              message: '必填',
                            },
                          ]}
                          fieldStyle={{ flex: 1 }}
                          field={`${field}[path]`}
                          placeholder="请输入文件夹 CID"
                        />
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
          </AppForm.ArrayField>
        </AppForm>
      </Modal>
    </Card>
  );
}
