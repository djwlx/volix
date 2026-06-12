import { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Empty, Spin, Toast, Tree, Typography } from '@douyinfe/semi-ui';
import { IconRefresh } from '@douyinfe/semi-icons';
import { useI18n } from '@/i18n';
import { browseFormatConvertOpenlist } from '@/services/format-convert';
import { getHttpErrorMessage } from '@/utils/error';
import { buildCloudSelectionEntry, type CloudSelectionEntry } from '../batch-selection';
import { toOpenlistTreeNodes, updateOpenlistTreeChildren, type OpenlistTreeNode } from '../openlist-tree';
import styles from './workbench.module.scss';

interface CloudSourceTreeProps {
  disabled?: boolean;
  selected: Record<string, CloudSelectionEntry>;
  onSelectionChange: (selected: Record<string, CloudSelectionEntry>) => void;
}

export function CloudSourceTree(props: CloudSourceTreeProps) {
  const { disabled, selected, onSelectionChange } = props;
  const { t } = useI18n();
  const [treeData, setTreeData] = useState<OpenlistTreeNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [loadingRoot, setLoadingRoot] = useState(false);
  const [loadingNodePath, setLoadingNodePath] = useState('');

  const selectedCount = useMemo(() => Object.keys(selected).length, [selected]);

  const loadRoot = async () => {
    try {
      setLoadingRoot(true);
      const response = await browseFormatConvertOpenlist('/');
      setTreeData(toOpenlistTreeNodes(response.data.content || [], 'file'));
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('formatConvert.browser.loadFailed')));
    } finally {
      setLoadingRoot(false);
    }
  };

  useEffect(() => {
    void loadRoot();
  }, []);

  const loadNodeData = async (treeNode?: { path?: string; isLeaf?: boolean; loaded?: boolean }) => {
    const node = treeNode as OpenlistTreeNode | undefined;
    if (!node || node.isLeaf || node.loaded) {
      return;
    }

    try {
      setLoadingNodePath(node.path);
      const response = await browseFormatConvertOpenlist(node.path);
      setTreeData(current =>
        updateOpenlistTreeChildren(current, node.path, toOpenlistTreeNodes(response.data.content || [], 'file'))
      );
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('formatConvert.browser.loadFailed')));
    } finally {
      setLoadingNodePath('');
    }
  };

  const toggleSelection = (item: { path: string; name: string }) => {
    const next = { ...selected };
    if (next[item.path]) {
      delete next[item.path];
    } else {
      next[item.path] = buildCloudSelectionEntry(item);
    }
    onSelectionChange(next);
  };

  return (
    <div className={styles.treePanel}>
      <div className={styles.treeToolbar}>
        <div>
          <Typography.Title heading={6} style={{ margin: 0 }}>
            {t('formatConvert.cloud.sourceTreeTitle')}
          </Typography.Title>
          <div className={styles.treeHint}>{t('formatConvert.cloud.sourceTreeHint')}</div>
        </div>
        <Button
          disabled={disabled || loadingRoot}
          icon={<IconRefresh />}
          theme="borderless"
          onClick={() => void loadRoot()}
        >
          {t('formatConvert.browser.refresh')}
        </Button>
      </div>

      <div className={styles.treeSurface}>
        {loadingRoot && !treeData.length ? (
          <div className={styles.treeLoadingState}>
            <Spin spinning />
            <div className={styles.treeLoadingText}>{t('formatConvert.cloud.sourceTreeLoading')}</div>
          </div>
        ) : treeData.length ? (
          <Spin spinning={loadingRoot}>
            <Tree
              directory
              disabled={disabled}
              expandedKeys={expandedKeys}
              loadData={loadNodeData}
              renderLabel={(_label, treeNode) => {
                const node = treeNode as OpenlistTreeNode;
                if (!node.isLeaf) {
                  return <span className={styles.treeDirLabel}>{node.name}</span>;
                }

                return (
                  <span onClick={event => event.stopPropagation()}>
                    <Checkbox
                      checked={Boolean(selected[node.path])}
                      className={styles.treeCheckbox}
                      disabled={disabled}
                      onChange={() => toggleSelection({ path: node.path, name: node.name })}
                    >
                      <span className={styles.treeFileText}>
                        <span className={styles.treeFileName}>{node.name}</span>
                        <span className={styles.treeFilePath}>{node.path}</span>
                      </span>
                    </Checkbox>
                  </span>
                );
              }}
              treeData={treeData}
              onExpand={keys => setExpandedKeys(keys)}
            />
          </Spin>
        ) : (
          <Empty image={null} title={t('formatConvert.cloud.sourceTreeEmpty')} />
        )}
      </div>

      <div className={styles.targetHint}>
        {loadingRoot
          ? t('formatConvert.cloud.sourceTreeLoading')
          : loadingNodePath
          ? t('formatConvert.cloud.sourceTreeNodeLoading', { path: loadingNodePath })
          : t('formatConvert.cloud.sourceTreeSelectedHint', { count: selectedCount })}
      </div>
    </div>
  );
}
