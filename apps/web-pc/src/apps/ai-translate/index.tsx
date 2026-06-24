import { useEffect, useState } from 'react';
import { Button, Empty, Space, Toast, Typography } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router';
import { PageCard, PageShell } from '@/components';
import { useI18n } from '@/i18n';
import { getAccountConfigs, translateText } from '@/services/user';
import { getHttpErrorMessage } from '@/utils/error';
import { TRANSLATE_LANGUAGE_OPTIONS } from './languages';
import styles from './index.module.scss';

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

  const handleCopy = async (text: string) => {
    if (!text) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      Toast.success(t('common.action.copied'));
    } catch {
      Toast.error(t('common.action.copyFailed'));
    }
  };

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
      <PageShell>
        <PageCard title={t('route.aiTranslate.title')} shadows="hover" style={{ width: '100%' }}>
          <Typography.Text>{t('common.status.loading')}</Typography.Text>
        </PageCard>
      </PageShell>
    );
  }

  if (!hasAiConfig) {
    return (
      <PageShell>
        <PageCard title={t('route.aiTranslate.title')} shadows="hover" style={{ width: '100%' }}>
          <Space vertical spacing={16} align="start" style={{ width: '100%' }}>
            <Empty
              title={t('aiTranslate.config.title')}
              description={t('aiTranslate.config.description')}
              image={null}
            />
            <Button type="primary" onClick={() => navigate('/setting/config/account')}>
              {t('aiTranslate.config.action')}
            </Button>
          </Space>
        </PageCard>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageCard title={t('route.aiTranslate.title')} shadows="hover" style={{ width: '100%' }}>
        <div className={styles.container}>
          <div className={styles.controls}>
            <label className={styles.field}>
              <Typography.Text>{t('aiTranslate.sourceLanguage.label')}</Typography.Text>
              <select
                value={sourceLanguage}
                className={styles.select}
                onChange={event => setSourceLanguage(event.target.value)}
              >
                {TRANSLATE_LANGUAGE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <Typography.Text>{t('aiTranslate.targetLanguage.label')}</Typography.Text>
              <select
                value={targetLanguage}
                className={styles.select}
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

          <div className={styles.actions}>
            <Button type="primary" loading={submitting} onClick={handleTranslate}>
              {t('aiTranslate.action.translate')}
            </Button>
          </div>

          <div className={styles.panes}>
            <div className={styles.pane}>
              <div className={styles.labelRow}>
                <Typography.Text>{t('aiTranslate.sourceText.label')}</Typography.Text>
                <Button
                  size="small"
                  theme="borderless"
                  disabled={!sourceText}
                  onClick={() => void handleCopy(sourceText)}
                >
                  {t('common.action.copy')}
                </Button>
              </div>
              <textarea
                value={sourceText}
                className={styles.textarea}
                onChange={event => setSourceText(event.target.value)}
              />
            </div>

            <div className={styles.pane}>
              <div className={styles.labelRow}>
                <Typography.Text>{t('aiTranslate.result.label')}</Typography.Text>
                <Button size="small" theme="borderless" disabled={!result} onClick={() => void handleCopy(result)}>
                  {t('common.action.copy')}
                </Button>
              </div>
              <pre className={styles.result}>{result || t('aiTranslate.result.empty')}</pre>
            </div>
          </div>
        </div>
      </PageCard>
    </PageShell>
  );
}

export default AiTranslateApp;
