import { Button, Empty, Input, Modal, Space, Spin, Table, Tree, Typography } from '@douyinfe/semi-ui';
import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { getHttpErrorMessage } from '@/utils/error';
import { browseFormatConvertOpenlist } from '@/services/format-convert';
import { toOpenlistTreeNodes, updateOpenlistTreeChildren, type OpenlistTreeNode } from '../openlist-tree';
import styles from './workbench.module.scss';

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
  const [items, setItems] = useState<OpenlistTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [loadingNodePath, setLoadingNodePath] = useState('');
  const [selectedDirPath, setSelectedDirPath] = useState('/');

  const load = async (nextPath = currentPath) => {
    try {
      setLoading(true);
      const response = await browseFormatConvertOpenlist(nextPath);
      setCurrentPath(response.data.path);
      setItems(toOpenlistTreeNodes(response.data.content || [], selectMode));
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
      setSelectedDirPath('/');
      void load('/');
    }
  }, [open, selectMode]);

  const loadNodeData = async (treeNode?: { path?: string; isLeaf?: boolean; loaded?: boolean }) => {
    const node = treeNode as OpenlistTreeNode | undefined;
    if (!node || node.isLeaf || node.loaded) {
      return;
    }

    try {
      setLoadingNodePath(node.path);
      const response = await browseFormatConvertOpenlist(node.path);
      setItems(current =>
        updateOpenlistTreeChildren(current, node.path, toOpenlistTreeNodes(response.data.content || [], 'dir'))
      );
    } catch (error) {
      Modal.error({
        title: t('formatConvert.browser.loadFailed'),
        content: getHttpErrorMessage(error, t('formatConvert.browser.loadFailed')),
      });
    } finally {
      setLoadingNodePath('');
    }
  };

  return (
    <Modal
      title={title}
      visible={open}
      onCancel={onCancel}
      footer={
        selectMode === 'dir' ? (
          <Button
            theme="solid"
            disabled={selectedDirPath === '/'}
            onClick={() => onSelect({ path: selectedDirPath, name: selectedDirPath })}
          >
            {t('formatConvert.browser.confirmDir')}
          </Button>
        ) : null
      }
    >
      {selectMode === 'dir' ? (
        <div className={styles.treePanel}>
          <div className={styles.treeToolbar}>
            <div>
              <Typography.Text strong>{t('formatConvert.browser.currentPath')}</Typography.Text>
              <div className={styles.treeHint}>{selectedDirPath}</div>
            </div>
            <Button disabled={loading} theme="borderless" onClick={() => void load('/')}>
              {t('formatConvert.browser.refresh')}
            </Button>
          </div>
          <div className={styles.treeSurface}>
            {loading && !items.length ? (
              <div className={styles.treeLoadingState}>
                <Spin spinning />
                <div className={styles.treeLoadingText}>{t('formatConvert.browser.treeLoading')}</div>
              </div>
            ) : items.length ? (
              <Spin spinning={loading}>
                <Tree
                  directory
                  expandedKeys={expandedKeys}
                  loadData={loadNodeData}
                  renderLabel={(_label, node) => (
                    <span className={styles.treeDirLabel}>{(node as OpenlistTreeNode).name}</span>
                  )}
                  selectedKey={selectedDirPath}
                  treeData={items}
                  onExpand={keys => setExpandedKeys(keys)}
                  onSelect={key => setSelectedDirPath(String((Array.isArray(key) ? key[0] : key) || '/'))}
                />
              </Spin>
            ) : (
              <Empty image={null} title={t('formatConvert.browser.treeEmpty')} />
            )}
          </div>
          <div className={styles.targetHint}>
            {loadingNodePath
              ? t('formatConvert.cloud.sourceTreeNodeLoading', { path: loadingNodePath })
              : t('formatConvert.browser.selectedDir', { path: selectedDirPath })}
          </div>
        </div>
      ) : (
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
                  render: (_text, record: OpenlistTreeNode) =>
                    record.isLeaf ? (
                      <span>{record.name}</span>
                    ) : (
                      <Button type="tertiary" onClick={() => void load(record.path)}>
                        {record.name}
                      </Button>
                    ),
                },
                {
                  title: t('formatConvert.browser.type'),
                  dataIndex: 'isLeaf',
                  render: (_text, record: OpenlistTreeNode) =>
                    record.isLeaf ? t('formatConvert.browser.file') : t('formatConvert.browser.dir'),
                },
                {
                  title: t('formatConvert.browser.action'),
                  render: (_text, record: OpenlistTreeNode) => (
                    <Button
                      size="small"
                      disabled={!record.isLeaf}
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
      )}
    </Modal>
  );
}
