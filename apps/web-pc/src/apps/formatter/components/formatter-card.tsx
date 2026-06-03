import { Toast } from '@douyinfe/semi-ui';
import { useDeferredValue, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useI18n } from '@/i18n';
import { buildFormatterPanelState } from '../panel-state';
import { JsonCodeView } from './json-code-view';
import styles from './formatter-card.module.scss';

const renderJsonHighlighted = (value: string) => {
  const tokenRegExp =
    /("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  value.replace(tokenRegExp, (match, stringToken, colon, literalToken, offset: number) => {
    if (offset > lastIndex) {
      parts.push(value.slice(lastIndex, offset));
    }

    let color = 'var(--app-text)';
    if (stringToken) {
      color = colon ? '#0369a1' : '#16a34a';
    } else if (literalToken === 'true' || literalToken === 'false') {
      color = '#7c3aed';
    } else if (literalToken === 'null') {
      color = '#64748b';
    } else {
      color = '#ea580c';
    }

    parts.push(
      <span key={`${offset}-${match}`} style={{ color }}>
        {match}
      </span>
    );
    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < value.length) {
    parts.push(value.slice(lastIndex));
  }

  return parts;
};

const renderXmlHighlighted = (value: string) => {
  const tokenRegExp = /(<[^>]+>)/g;
  const segments = value.split(tokenRegExp);

  const highlightTag = (tag: string, index: number) => {
    const commentMatch = tag.match(/^<!--[\s\S]*-->$/);
    if (commentMatch) {
      return (
        <span key={`${index}-${tag}`} style={{ color: '#64748b' }}>
          {tag}
        </span>
      );
    }

    const cdataMatch = tag.match(/^<!\[CDATA\[[\s\S]*\]\]>$/);
    if (cdataMatch) {
      return (
        <span key={`${index}-${tag}`} style={{ color: '#64748b' }}>
          {tag}
        </span>
      );
    }

    const parts: ReactNode[] = [];
    let cursor = 0;
    const pushText = (text: string, color: string) => {
      if (!text) {
        return;
      }

      parts.push(
        <span key={`${index}-${cursor}-${text}`} style={{ color }}>
          {text}
        </span>
      );
      cursor += text.length;
    };

    const closeTagMatch = tag.match(/^(<\/)([^\s>]+)(\s*>$)/);
    if (closeTagMatch) {
      pushText(closeTagMatch[1], '#b45309');
      pushText(closeTagMatch[2], '#0369a1');
      pushText(closeTagMatch[3], '#b45309');
      return <>{parts}</>;
    }

    const openTagMatch = tag.match(/^(<\??)([^\s/>?]+)([\s\S]*?)(\/?>)$/);
    if (!openTagMatch) {
      return (
        <span key={`${index}-${tag}`} style={{ color: '#0369a1' }}>
          {tag}
        </span>
      );
    }

    const [, left, tagName, attrBlock, right] = openTagMatch;
    pushText(left, '#b45309');
    pushText(tagName, '#0369a1');

    if (attrBlock) {
      const attrRegExp = /(\s+)([^\s=]+)(=)("[^"]*"|'[^']*')/g;
      let lastAttrIndex = 0;
      let attrMatch = attrRegExp.exec(attrBlock);

      while (attrMatch) {
        const [full, leadingSpace, attrName, equalSign, attrValue] = attrMatch;
        const start = attrMatch.index;
        if (start > lastAttrIndex) {
          pushText(attrBlock.slice(lastAttrIndex, start), '#5b697f');
        }
        pushText(leadingSpace, '#5b697f');
        pushText(attrName, '#0f766e');
        pushText(equalSign, '#5b697f');
        pushText(attrValue, '#16a34a');
        lastAttrIndex = start + full.length;
        attrMatch = attrRegExp.exec(attrBlock);
      }

      if (lastAttrIndex < attrBlock.length) {
        pushText(attrBlock.slice(lastAttrIndex), '#5b697f');
      }
    }

    pushText(right, '#b45309');
    return <>{parts}</>;
  };

  return segments.map((segment, index) => {
    if (!segment) {
      return null;
    }

    if (segment.startsWith('<')) {
      return <span key={`${index}-${segment}`}>{highlightTag(segment, index)}</span>;
    }

    return (
      <span key={`${index}-${segment}`} style={{ color: '#5b697f' }}>
        {segment}
      </span>
    );
  });
};

export function FormatterCard() {
  const { t } = useI18n();
  const [source, setSource] = useState('');
  const deferredSource = useDeferredValue(source);
  const outputPaneRef = useRef<HTMLDivElement | null>(null);
  const panelState = useMemo(() => buildFormatterPanelState(deferredSource), [deferredSource]);

  const highlightedResult = useMemo(() => {
    if (panelState.outputMode !== 'formatted' || !panelState.formatted) {
      return null;
    }

    if (panelState.detailType === 'json') {
      return renderJsonHighlighted(panelState.formatted);
    }

    if (panelState.detailType === 'xml') {
      return renderXmlHighlighted(panelState.formatted);
    }

    return panelState.formatted;
  }, [panelState.detailType, panelState.formatted, panelState.outputMode]);

  const selectOutputPaneContent = () => {
    const host = outputPaneRef.current;
    if (!host) {
      return;
    }

    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    const range = document.createRange();
    range.selectNodeContents(host);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const onCopyResult = async () => {
    if (!panelState.formatted) {
      Toast.warning(t('formatter.error.copyEmpty'));
      return;
    }

    try {
      await navigator.clipboard.writeText(panelState.formatted);
      Toast.success(t('formatter.action.copyResult'));
    } catch {
      Toast.error(t('formatter.error.copyFailed'));
    }
  };

  const onOutputKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      selectOutputPaneContent();
    }
  };

  return (
    <section className={styles.shell}>
      <div className={styles.paneGrid}>
        <section className={styles.pane}>
          <textarea
            value={source}
            onChange={event => setSource(event.target.value)}
            placeholder={t('formatter.placeholder.input')}
            className={styles.inputArea}
            spellCheck={false}
          />
        </section>

        <section className={styles.pane}>
          <div
            className={styles.outputPane}
            ref={outputPaneRef}
            tabIndex={0}
            onKeyDown={onOutputKeyDown}
            onDoubleClick={() => {
              void onCopyResult();
            }}
          >
            {panelState.outputMode === 'empty' ? (
              <div className={styles.outputEmpty} />
            ) : panelState.outputMode === 'json-tree' && panelState.parsedJson ? (
              <JsonCodeView value={panelState.parsedJson} />
            ) : (
              <pre className={styles.outputPre}>{highlightedResult || panelState.formatted}</pre>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
