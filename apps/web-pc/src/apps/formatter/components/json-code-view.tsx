import { useEffect, useMemo, useState } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import type { JsonValue } from '../types';

interface JsonCodeViewProps {
  value: JsonValue;
}

interface JsonLineProps {
  gutter?: ReactNode;
  code: ReactNode;
  depth: number;
  onContextMenu?: (event: ReactMouseEvent<HTMLDivElement>) => void;
}

interface JsonNodeProps {
  value: JsonValue;
  path: string;
  name?: string;
  trailingComma?: boolean;
  expandedPaths: Set<string>;
  onToggle: (path: string, expanded: boolean) => void;
  onFieldContextMenu: (
    event: ReactMouseEvent<HTMLDivElement>,
    payload: { fieldName?: string; value: JsonValue }
  ) => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  fieldName?: string;
  value: JsonValue;
}

const previewStyle: CSSProperties = {
  margin: 0,
  padding: 12,
  borderRadius: 8,
  border: '1px solid var(--semi-color-border)',
  background: 'linear-gradient(180deg, #fbfdff 0%, #f5f9fc 100%)',
  overflow: 'auto',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: 13,
  lineHeight: 1.7,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  position: 'relative',
};

function JsonCodeLine(props: JsonLineProps) {
  const { gutter, code, depth, onContextMenu } = props;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', minHeight: 22 }} onContextMenu={onContextMenu}>
      <div
        style={{
          width: 22,
          flex: '0 0 22px',
          color: '#0f766e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
        }}
      >
        {gutter}
      </div>
      <div style={{ paddingLeft: depth * 16, whiteSpace: 'pre-wrap', wordBreak: 'break-word', flex: 1 }}>{code}</div>
    </div>
  );
}

const getJsonDepth = (path: string) => Math.max(path.split('.').length - 1, 0);

function JsonCodeNode(props: JsonNodeProps) {
  const { value, path, name, trailingComma = false, expandedPaths, onToggle, onFieldContextMenu } = props;
  const depth = getJsonDepth(path);
  const isArray = Array.isArray(value);
  const isObject = typeof value === 'object' && value !== null;
  const keyLabel =
    typeof name === 'undefined' ? null : (
      <>
        <span style={{ color: '#0369a1' }}>"{name}"</span>
        <span>: </span>
      </>
    );

  const onContextMenu = (event: ReactMouseEvent<HTMLDivElement>) => {
    onFieldContextMenu(event, { fieldName: name, value });
  };

  if (!isObject) {
    let color = '#16a34a';
    let display = JSON.stringify(value);

    if (typeof value === 'number') {
      color = '#ea580c';
    } else if (typeof value === 'boolean') {
      color = '#7c3aed';
    } else if (value === null) {
      color = '#64748b';
      display = 'null';
    }

    return (
      <JsonCodeLine
        depth={depth}
        onContextMenu={onContextMenu}
        code={
          <>
            {keyLabel}
            <span style={{ color }}>{display}</span>
            {trailingComma ? <span style={{ color: '#334155' }}>,</span> : null}
          </>
        }
      />
    );
  }

  const entries = isArray
    ? value.map((item, index) => [String(index), item] as const)
    : Object.entries(value).map(([key, item]) => [key, item] as const);
  const expanded = expandedPaths.has(path);
  const bracketStart = isArray ? '[' : '{';
  const bracketEnd = isArray ? ']' : '}';

  if (!expanded) {
    return (
      <JsonCodeLine
        depth={depth}
        onContextMenu={onContextMenu}
        gutter={
          <button
            type="button"
            onClick={() => onToggle(path, true)}
            style={{
              border: 0,
              background: 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
            }}
          >
            ▸
          </button>
        }
        code={
          <>
            {keyLabel}
            <span style={{ color: '#334155' }}>
              {bracketStart} ... {bracketEnd}
            </span>
            {trailingComma ? <span style={{ color: '#334155' }}>,</span> : null}
          </>
        }
      />
    );
  }

  return (
    <>
      <JsonCodeLine
        depth={depth}
        onContextMenu={onContextMenu}
        gutter={
          <button
            type="button"
            onClick={() => onToggle(path, false)}
            style={{
              border: 0,
              background: 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
            }}
          >
            ▾
          </button>
        }
        code={
          <>
            {keyLabel}
            <span style={{ color: '#334155' }}>{bracketStart}</span>
          </>
        }
      />
      {entries.map(([key, item], index) => (
        <JsonCodeNode
          key={`${path}.${key}`}
          value={item}
          name={isArray ? undefined : key}
          path={`${path}.${key}`}
          trailingComma={index < entries.length - 1}
          expandedPaths={expandedPaths}
          onToggle={onToggle}
          onFieldContextMenu={onFieldContextMenu}
        />
      ))}
      <JsonCodeLine
        depth={depth}
        code={
          <span style={{ color: '#334155' }}>
            {bracketEnd}
            {trailingComma ? ',' : ''}
          </span>
        }
      />
    </>
  );
}

export function JsonCodeView(props: JsonCodeViewProps) {
  const { value } = props;
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    window.addEventListener('scroll', closeMenu, true);
    return () => {
      window.removeEventListener('click', closeMenu);
      window.removeEventListener('scroll', closeMenu, true);
    };
  }, []);

  const collectAllPaths = (node: JsonValue, path: string, acc: Set<string>) => {
    if (typeof node !== 'object' || node === null) {
      return;
    }

    acc.add(path);
    if (Array.isArray(node)) {
      node.forEach((item, index) => collectAllPaths(item, `${path}.${index}`, acc));
      return;
    }

    Object.entries(node).forEach(([key, item]) => collectAllPaths(item, `${path}.${key}`, acc));
  };

  const allPaths = useMemo(() => {
    const paths = new Set<string>();
    collectAllPaths(value, 'root', paths);
    return paths;
  }, [value]);

  useEffect(() => {
    setExpandedPaths(new Set(allPaths));
  }, [allPaths]);

  const copyText = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      Toast.success(successMessage);
      setContextMenu(null);
    } catch {
      Toast.error('复制失败');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setExpandedPaths(new Set(allPaths))}
          style={{
            border: '1px solid var(--semi-color-border)',
            background: '#fff',
            borderRadius: 6,
            padding: '4px 10px',
            cursor: 'pointer',
          }}
        >
          默认展开
        </button>
        <button
          type="button"
          onClick={() => setExpandedPaths(new Set(allPaths))}
          style={{
            border: '1px solid var(--semi-color-border)',
            background: '#fff',
            borderRadius: 6,
            padding: '4px 10px',
            cursor: 'pointer',
          }}
        >
          全部展开
        </button>
        <button
          type="button"
          onClick={() => setExpandedPaths(new Set())}
          style={{
            border: '1px solid var(--semi-color-border)',
            background: '#fff',
            borderRadius: 6,
            padding: '4px 10px',
            cursor: 'pointer',
          }}
        >
          全部收起
        </button>
      </div>
      <div style={previewStyle}>
        <JsonCodeNode
          value={value}
          path="root"
          expandedPaths={expandedPaths}
          onToggle={(path, expanded) => {
            setExpandedPaths(prev => {
              const next = new Set(prev);
              if (expanded) {
                next.add(path);
              } else {
                next.delete(path);
              }
              return next;
            });
          }}
          onFieldContextMenu={(event, payload) => {
            event.preventDefault();
            setContextMenu({
              x: event.clientX,
              y: event.clientY,
              fieldName: payload.fieldName,
              value: payload.value,
            });
          }}
        />
        {contextMenu ? (
          <div
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 2000,
              background: '#fff',
              border: '1px solid rgba(15, 23, 42, 0.12)',
              borderRadius: 10,
              boxShadow: '0 12px 28px rgba(15, 23, 42, 0.16)',
              padding: 6,
              minWidth: 180,
            }}
          >
            <button
              type="button"
              onClick={() => copyText(JSON.stringify(contextMenu.value, null, 2), '字段内容已复制')}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                border: 0,
                background: 'transparent',
                padding: '8px 10px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              复制该字段内容
            </button>
            {contextMenu.fieldName ? (
              <button
                type="button"
                onClick={() => copyText(contextMenu.fieldName || '', '字段名已复制')}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  border: 0,
                  background: 'transparent',
                  padding: '8px 10px',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                复制字段名
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
