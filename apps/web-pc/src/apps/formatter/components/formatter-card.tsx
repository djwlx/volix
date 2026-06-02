import { useMemo, useState } from 'react';
import { Button, Card, Space, Tag, Toast, Typography } from '@douyinfe/semi-ui';
import type { ClipboardEvent, CSSProperties, ChangeEvent, ReactNode } from 'react';
import { useI18n } from '@/i18n';
import { JsonCodeView } from './json-code-view';
import { formatContent } from '../utils/format-content';
import { monoFont } from '../utils/shared';
import type { FormatType, JsonValue } from '../types';

const textAreaStyle: CSSProperties = {
  width: '100%',
  minHeight: 220,
  resize: 'vertical',
  border: '1px solid var(--semi-color-border)',
  borderRadius: 8,
  padding: 12,
  fontFamily: monoFont,
  fontSize: 13,
  lineHeight: 1.6,
  outline: 'none',
  boxSizing: 'border-box',
  background: 'var(--semi-color-bg-0)',
  color: 'var(--semi-color-text-0)',
};

const previewStyle: CSSProperties = {
  margin: 0,
  padding: 12,
  borderRadius: 8,
  border: '1px solid var(--semi-color-border)',
  background: 'var(--app-preview-bg)',
  overflow: 'auto',
  fontFamily: monoFont,
  fontSize: 13,
  lineHeight: 1.7,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

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

  return segments.map((segment, index) => {
    if (!segment) {
      return null;
    }

    if (segment.startsWith('</')) {
      return (
        <span key={`${index}-${segment}`} style={{ color: '#b45309' }}>
          {segment}
        </span>
      );
    }

    if (segment.startsWith('<')) {
      return (
        <span key={`${index}-${segment}`} style={{ color: '#0369a1' }}>
          {segment}
        </span>
      );
    }

    return (
      <span key={`${index}-${segment}`} style={{ color: 'var(--app-text-soft)' }}>
        {segment}
      </span>
    );
  });
};

export function FormatterCard() {
  const { t } = useI18n();
  const [source, setSource] = useState('');
  const [formatted, setFormatted] = useState('');
  const [formatType, setFormatType] = useState<FormatType | null>(null);
  const [detailType, setDetailType] = useState<'json' | 'xml' | 'text' | null>(null);
  const [parsedJson, setParsedJson] = useState<JsonValue | null>(null);

  const highlightedResult = useMemo(() => {
    if (!formatted || !formatType) {
      return null;
    }

    if (detailType === 'json') {
      return renderJsonHighlighted(formatted);
    }

    if (detailType === 'xml') {
      return renderXmlHighlighted(formatted);
    }

    return formatted;
  }, [detailType, formatType, formatted]);

  const resetState = () => {
    setSource('');
    setFormatted('');
    setFormatType(null);
    setDetailType(null);
    setParsedJson(null);
  };

  const runFormat = (value: string) => {
    const nextValue = value.trim();
    if (!nextValue) {
      resetState();
      return;
    }

    try {
      const result = formatContent(nextValue);
      setSource(value);
      setFormatted(result.formatted);
      setFormatType(result.formatType);
      setDetailType(result.detailType || null);
      setParsedJson(result.parsedJson || null);
    } catch (error) {
      setSource(value);
      setFormatted('');
      setFormatType(null);
      setDetailType(null);
      setParsedJson(null);
      Toast.error(error instanceof Error ? error.message : t('formatter.error.formatFailed'));
    }
  };

  const onCopy = async () => {
    if (!formatted) {
      Toast.warning(t('formatter.error.copyEmpty'));
      return;
    }

    try {
      await navigator.clipboard.writeText(formatted);
      Toast.success(t('formatter.action.copyResult'));
    } catch {
      Toast.error(t('formatter.error.copyFailed'));
    }
  };

  return (
    <Card
      shadows="hover"
      style={{ width: '100%' }}
      headerExtraContent={
        formatType ? (
          <Space>
            <Tag color="green">{formatType.toUpperCase()}</Tag>
            {detailType && detailType !== formatType ? <Tag color="blue">{detailType.toUpperCase()}</Tag> : null}
          </Space>
        ) : null
      }
      bodyStyle={{ display: 'grid', gap: 12 }}
    >
      <textarea
        value={source}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setSource(event.target.value)}
        onPaste={(event: ClipboardEvent<HTMLTextAreaElement>) => {
          const textarea = event.currentTarget;
          window.setTimeout(() => runFormat(textarea.value), 0);
        }}
        placeholder={t('formatter.placeholder.input')}
        style={textAreaStyle}
      />
      <Space wrap>
        <Button theme="solid" type="primary" onClick={() => runFormat(source)}>
          {t('formatter.action.format')}
        </Button>
        <Button onClick={onCopy} disabled={!formatted}>
          {t('formatter.action.copyResult')}
        </Button>
        <Button type="tertiary" onClick={resetState}>
          {t('formatter.action.clear')}
        </Button>
      </Space>
      <div style={{ display: 'grid', gap: 8 }}>
        <Typography.Text strong style={{ color: 'var(--app-text)' }}>
          {t('formatter.result.title')}
        </Typography.Text>
        {formatType === 'json' && parsedJson ? (
          <JsonCodeView value={parsedJson} />
        ) : (
          <pre style={previewStyle}>{highlightedResult || t('formatter.placeholder.result')}</pre>
        )}
      </div>
    </Card>
  );
}
