import { FormatterCard } from './components';

function FormatterApp() {
  return (
    <div
      style={{
        width: '100%',
        padding: 16,
        maxWidth: 1200,
        margin: '0 auto',
        display: 'grid',
        gap: 16,
        boxSizing: 'border-box',
      }}
    >
      <FormatterCard />
    </div>
  );
}

export default FormatterApp;
