import { AppHeader } from '@/components';
import { FormatterCard } from './components';
import { useNavigate } from 'react-router';
import formatterIcon from '@/assets/icons/formatter.svg';

function FormatterApp() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        width: '100%',
        height: '100dvh',
        background: 'var(--app-page-bg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppHeader
        title="智能格式化"
        description="支持 JSON、XML、Base64 的智能识别、递归解码和结构化查看。"
        logo={<img alt="智能格式化" src={formatterIcon} style={{ display: 'block', width: 44, height: 44 }} />}
        onLogoClick={() => navigate('/')}
      />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          padding: 16,
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gap: 16,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <FormatterCard />
      </div>
    </div>
  );
}

export default FormatterApp;
