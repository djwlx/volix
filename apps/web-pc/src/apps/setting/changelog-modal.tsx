import { Modal, Empty } from '@douyinfe/semi-ui';
import type { ReactNode } from 'react';
import { useI18n } from '@/i18n';
import styles from './changelog-modal.module.scss';

interface ChangelogModalProps {
  visible: boolean;
  onClose: () => void;
}

const renderChangelog = (raw: string, isChinese: boolean): ReactNode[] => {
  const lines = raw.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let active = true;

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }
    const items = listItems;
    blocks.push(
      <ul className={styles.list} key={`list-${blocks.length}`}>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach(line => {
    const text = line.trim();
    if (/^####\s+/.test(text)) {
      if (!active) {
        return;
      }
      flushList();
      blocks.push(
        <h4 className={styles.h4} key={`h4-${blocks.length}`}>
          {text.replace(/^####\s+/, '')}
        </h4>
      );
    } else if (/^###\s+/.test(text)) {
      const heading = text.replace(/^###\s+/, '').trim();
      const lower = heading.toLowerCase();
      if (heading === '中文' || lower === 'chinese') {
        flushList();
        active = isChinese;
        return;
      }
      if (heading === '英文' || lower === 'english') {
        flushList();
        active = !isChinese;
        return;
      }
      if (!active) {
        return;
      }
      flushList();
      blocks.push(
        <h3 className={styles.h3} key={`h3-${blocks.length}`}>
          {heading}
        </h3>
      );
    } else if (/^##\s+/.test(text)) {
      flushList();
      active = true;
      blocks.push(
        <h2 className={styles.h2} key={`h2-${blocks.length}`}>
          {text.replace(/^##\s+/, '')}
        </h2>
      );
    } else if (/^#\s+/.test(text)) {
      flushList();
    } else if (/^[-*]\s+/.test(text)) {
      if (active) {
        listItems.push(text.replace(/^[-*]\s+/, ''));
      }
    } else if (text === '') {
      flushList();
    } else if (active) {
      flushList();
      blocks.push(
        <p className={styles.p} key={`p-${blocks.length}`}>
          {text}
        </p>
      );
    }
  });

  flushList();
  return blocks;
};

export function ChangelogModal({ visible, onClose }: ChangelogModalProps) {
  const { t, locale } = useI18n();
  const content = renderChangelog(__APP_CHANGELOG__ || '', locale.startsWith('zh'));

  return (
    <Modal
      title={t({ id: 'setting.changelog.title', defaultMessage: '更新日志' })}
      visible={visible}
      onCancel={onClose}
      footer={null}
      width="min(680px, 92vw)"
    >
      {content.length > 0 ? (
        <div className={styles.changelog}>{content}</div>
      ) : (
        <Empty title={t({ id: 'setting.changelog.empty', defaultMessage: '暂无更新日志' })} />
      )}
    </Modal>
  );
}
