import { Button, Input, Modal, Space, Spin, Table, Typography } from '@douyinfe/semi-ui';
import type { FormatConvertOpenlistBrowserItem } from '@volix/types';
import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { getHttpErrorMessage } from '@/utils/error';
import { browseFormatConvertOpenlist } from '@/services/format-convert';

interface OpenlistBrowserProps {
  open: boolean;
  selectMode: 'file' | 'dir';
  title: string;
  onCancel: () => void;
  onSelect: (item: { path: string; name: string }) => void;
}

export function OpenlistBrowser(props: OpenlistBrowserProps) {
  const { open, selectMode, title, onCancel, onSelect } = props;
  const { t } = useI18n();
  const [currentPath, setCurrentPath] = useState('/');
  const [items, setItems] = useState<FormatConvertOpenlistBrowserItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async (nextPath = currentPath) => {
    try {
      setLoading(true);
      const response = await browseFormatConvertOpenlist(nextPath);
      setCurrentPath(response.data.path);
      setItems(response.data.content || []);
    } catch (error) {
      Modal.error({
        title: t('formatConvert.browser.loadFailed'),
        content: getHttpErrorMessage(error, t('formatConvert.browser.loadFailed')),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      void load('/');
    }
  }, [open]);

  return (
    <Modal
      title={title}
      visible={open}
      onCancel={onCancel}
      footer={
        selectMode === 'dir' ? (
          <Button
            theme="solid"
            disabled={currentPath === '/'}
            onClick={() => onSelect({ path: currentPath, name: currentPath })}
          >
            {t('formatConvert.browser.selectCurrent')}
          </Button>
        ) : null
      }
    >
      <Space vertical align="start" style={{ width: '100%' }}>
        <div style={{ width: '100%' }}>
          <Typography.Text strong>{t('formatConvert.browser.currentPath')}</Typography.Text>
          <Input
            value={currentPath}
            style={{ marginTop: 8 }}
            onChange={setCurrentPath}
            suffix={
              <Button size="small" onClick={() => void load(currentPath)}>
                {t('formatConvert.browser.refresh')}
              </Button>
            }
          />
        </div>
        <Spin spinning={loading} style={{ width: '100%' }}>
          <Table
            dataSource={items}
            pagination={false}
            rowKey="path"
            size="small"
            columns={[
              {
                title: t('formatConvert.browser.name'),
                dataIndex: 'name',
                render: (_text, record: FormatConvertOpenlistBrowserItem) =>
                  record.isDir ? (
                    <Button type="tertiary" onClick={() => void load(record.path)}>
                      {record.name}
                    </Button>
                  ) : (
                    <span>{record.name}</span>
                  ),
              },
              {
                title: t('formatConvert.browser.type'),
                dataIndex: 'isDir',
                render: (_text, record: FormatConvertOpenlistBrowserItem) =>
                  record.isDir ? t('formatConvert.browser.dir') : t('formatConvert.browser.file'),
              },
              {
                title: t('formatConvert.browser.action'),
                render: (_text, record: FormatConvertOpenlistBrowserItem) => (
                  <Button
                    size="small"
                    disabled={selectMode === 'file' ? record.isDir : false}
                    onClick={() => onSelect({ path: record.path, name: record.name })}
                  >
                    {t('formatConvert.browser.select')}
                  </Button>
                ),
              },
            ]}
          />
        </Spin>
      </Space>
    </Modal>
  );
}
