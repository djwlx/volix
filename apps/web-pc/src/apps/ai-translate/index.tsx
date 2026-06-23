import { useEffect, useState } from 'react';
import { Button, Empty, Space, Toast, Typography } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router';
import { PageCard } from '@/components';
import { useI18n } from '@/i18n';
import { getAccountConfigs, translateText } from '@/services/user';
import { getHttpErrorMessage } from '@/utils/error';
import { TRANSLATE_LANGUAGE_OPTIONS } from './languages';

const fieldStyle = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 8,
};

const inputStyle = {
  width: '100%',
  minHeight: 120,
  padding: 12,
  borderRadius: 12,
  border: '1px solid var(--semi-color-border)',
  background: 'var(--semi-color-bg-0)',
  color: 'var(--semi-color-text-0)',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

const selectStyle = {
  ...inputStyle,
  minHeight: 40,
  padding: '0 12px',
};

const resultStyle = {
  minHeight: 120,
  margin: 0,
  padding: 12,
  borderRadius: 12,
  border: '1px solid var(--semi-color-border)',
  background: 'var(--semi-color-fill-0)',
  color: 'var(--semi-color-text-0)',
  whiteSpace: 'pre-wrap' as const,
  wordBreak: 'break-word' as const,
};

function AiTranslateApp() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [hasAiConfig, setHasAiConfig] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sourceText, setSourceText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('en-US');
  const [result, setResult] = useState('');

  useEffect(() => {
    let active = true;

    const loadConfigs = async () => {
      try {
        const res = await getAccountConfigs();
        if (!active) {
          return;
        }
        setHasAiConfig(Boolean(res.data?.ai));
      } catch (error) {
        if (!active) {
          return;
        }
        Toast.error(getHttpErrorMessage(error, t('setting.account.loadFailed')));
      } finally {
        if (active) {
          setLoadingConfig(false);
        }
      }
    };

    void loadConfigs();

    return () => {
      active = false;
    };
  }, [t]);

  const handleTranslate = async () => {
    try {
      setSubmitting(true);
      const res = await translateText({
        text: sourceText,
        sourceLanguage,
        targetLanguage,
      });
      setResult(String(res.data?.text || '').trim());
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('common.error.requestFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingConfig) {
    return (
      <PageCard title={t('route.aiTranslate.title')} shadows="hover" style={{ width: '100%' }}>
        <Typography.Text>{t('common.status.loading')}</Typography.Text>
      </PageCard>
    );
  }

  if (!hasAiConfig) {
    return (
      <PageCard title={t('route.aiTranslate.title')} shadows="hover" style={{ width: '100%' }}>
        <Space vertical spacing={16} align="start" style={{ width: '100%' }}>
          <Empty title={t('aiTranslate.config.title')} description={t('aiTranslate.config.description')} image={null} />
          <Button type="primary" onClick={() => navigate('/setting/config/account')}>
            {t('aiTranslate.config.action')}
          </Button>
        </Space>
      </PageCard>
    );
  }

  return (
    <PageCard title={t('route.aiTranslate.title')} shadows="hover" style={{ width: '100%' }}>
      <Space vertical spacing={16} align="start" style={{ width: '100%' }}>
        <div style={fieldStyle}>
          <Typography.Text>{t('aiTranslate.sourceText.label')}</Typography.Text>
          <textarea value={sourceText} style={inputStyle} onChange={event => setSourceText(event.target.value)} />
        </div>

        <div style={{ ...fieldStyle, flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ ...fieldStyle, flex: 1, minWidth: 220 }}>
            <Typography.Text>{t('aiTranslate.sourceLanguage.label')}</Typography.Text>
            <select
              value={sourceLanguage}
              style={selectStyle}
              onChange={event => setSourceLanguage(event.target.value)}
            >
              {TRANSLATE_LANGUAGE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </label>

          <label style={{ ...fieldStyle, flex: 1, minWidth: 220 }}>
            <Typography.Text>{t('aiTranslate.targetLanguage.label')}</Typography.Text>
            <select
              value={targetLanguage}
              style={selectStyle}
              onChange={event => setTargetLanguage(event.target.value)}
            >
              {TRANSLATE_LANGUAGE_OPTIONS.filter(option => option.value !== 'auto').map(option => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <Button type="primary" loading={submitting} onClick={handleTranslate}>
          {t('aiTranslate.action.translate')}
        </Button>

        <div style={fieldStyle}>
          <Typography.Text>{t('aiTranslate.result.label')}</Typography.Text>
          <pre style={resultStyle}>{result || t('aiTranslate.result.empty')}</pre>
        </div>
      </Space>
    </PageCard>
  );
}

export default AiTranslateApp;
