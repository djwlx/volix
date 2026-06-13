import { useEffect, useState } from 'react';
import { Button, Modal } from '@douyinfe/semi-ui';
import { useI18n } from '@/i18n';
import { OpenlistTableBrowser } from './openlist-table-browser';

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
  const [selectedDirPath, setSelectedDirPath] = useState('/');

  useEffect(() => {
    if (open) {
      setSelectedDirPath('/');
    }
  }, [open, selectMode]);

  return (
    <Modal
      title={title}
      visible={open}
      onCancel={onCancel}
      width="min(720px, 92vw)"
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
      <OpenlistTableBrowser
        selectMode={selectMode}
        selectedDirPath={selectedDirPath}
        selectionMode={selectMode === 'file' ? 'single' : 'multiple'}
        onDirSelectionChange={setSelectedDirPath}
        onFileSelectionChange={items => {
          const item = items[0];
          if (item) {
            onSelect(item);
          }
        }}
      />
    </Modal>
  );
}
