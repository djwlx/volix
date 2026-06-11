import { Button, Card, Space, Toast, Typography } from '@douyinfe/semi-ui';
import { FormatConvertSourceType, FormatConvertTargetType } from '@volix/types';
import { useState } from 'react';
import { useI18n } from '@/i18n';
import { getHttpErrorMessage } from '@/utils/error';
import { createCloudFormatConvertTask } from '@/services/format-convert';
import { createCloudTaskPayload, createFormatConvertDraft } from '../preset-options';
import { ConvertOptionForm } from './convert-option-form';
import { OpenlistBrowser } from './openlist-browser';

interface CloudConvertCardProps {
  onCreated: () => void;
}

export function CloudConvertCard(props: CloudConvertCardProps) {
  const { onCreated } = props;
  const { t } = useI18n();
  const [draft, setDraft] = useState(createFormatConvertDraft());
  const [submitting, setSubmitting] = useState(false);
  const [source, setSource] = useState<{ path: string; name: string } | null>(null);
  const [targetDir, setTargetDir] = useState<{ path: string; name: string } | null>(null);
  const [browserMode, setBrowserMode] = useState<'source' | 'target' | ''>('');

  const onSubmit = async () => {
    if (!source) {
      Toast.warning(t('formatConvert.cloud.sourceRequired'));
      return;
    }
    if (!targetDir) {
      Toast.warning(t('formatConvert.cloud.targetRequired'));
      return;
    }
    if ((targetDir.path || '').trim() === '/') {
      Toast.warning(t('formatConvert.error.targetRootNotAllowed'));
      return;
    }
    try {
      setSubmitting(true);
      await createCloudFormatConvertTask({
        ...createCloudTaskPayload(source.path, source.name, targetDir.path, draft),
        source: {
          type: FormatConvertSourceType.OPENLIST,
          path: source.path,
          fileName: source.name,
        },
        target: {
          type: FormatConvertTargetType.OPENLIST,
          dirPath: targetDir.path,
          fileName: draft.targetFileName,
        },
      });
      Toast.success(t('formatConvert.cloud.createSuccess'));
      onCreated();
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('formatConvert.error.createCloudFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title={t('formatConvert.cloud.title')} shadows="hover">
      <Space vertical align="start" style={{ width: '100%' }} spacing={16}>
        <div style={{ width: '100%' }}>
          <Typography.Text strong>{t('formatConvert.cloud.sourceFile')}</Typography.Text>
          <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 8 }}>
            <span>{source?.path || t('formatConvert.cloud.noSource')}</span>
            <Button onClick={() => setBrowserMode('source')}>{t('formatConvert.cloud.pickSource')}</Button>
          </Space>
        </div>
        <div style={{ width: '100%' }}>
          <Typography.Text strong>{t('formatConvert.cloud.targetDir')}</Typography.Text>
          <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 8 }}>
            <span>{targetDir?.path || t('formatConvert.cloud.noTarget')}</span>
            <Button onClick={() => setBrowserMode('target')}>{t('formatConvert.cloud.pickTarget')}</Button>
          </Space>
        </div>
        <ConvertOptionForm draft={draft} onChange={setDraft} />
        <Button theme="solid" loading={submitting} onClick={onSubmit}>
          {t('formatConvert.cloud.submit')}
        </Button>
      </Space>
      <OpenlistBrowser
        open={browserMode === 'source'}
        selectMode="file"
        title={t('formatConvert.cloud.pickSource')}
        onCancel={() => setBrowserMode('')}
        onSelect={item => {
          setSource(item);
          setBrowserMode('');
        }}
      />
      <OpenlistBrowser
        open={browserMode === 'target'}
        selectMode="dir"
        title={t('formatConvert.cloud.pickTarget')}
        onCancel={() => setBrowserMode('')}
        onSelect={item => {
          setTargetDir(item);
          setBrowserMode('');
        }}
      />
    </Card>
  );
}
