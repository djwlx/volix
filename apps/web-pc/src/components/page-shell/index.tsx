import type { PropsWithChildren } from 'react';

const pageShellStyle: React.CSSProperties = {
  width: '100%',
  padding: '24px 16px 32px',
  boxSizing: 'border-box',
};

export function PageShell({ children }: PropsWithChildren) {
  return <div style={pageShellStyle}>{children}</div>;
}
