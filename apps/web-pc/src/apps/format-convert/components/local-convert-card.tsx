import { Button, Card, Space, Toast, Typography } from '@douyinfe/semi-ui';
import { FormatConvertTargetType } from '@volix/types';
import { useState } from 'react';
import { useI18n } from '@/i18n';
import { getHttpErrorMessage } from '@/utils/error';
import { createLocalFormatConvertTask } from '@/services/format-convert';
import { createFormatConvertDraft, getSuggestedTargetFileName } from '../preset-options';
import { ConvertOptionForm } from './convert-option-form';

interface LocalConvertCardProps {
  onCreated: () => void;
}

export function LocalConvertCard(props: LocalConvertCardProps) {
  const { onCreated } = props;
  const { t } = useI18n();
  const [draft, setDraft] = useState(createFormatConvertDraft());
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!file) {
      Toast.warning(t('formatConvert.local.fileRequired'));
      return;
    }
    try {
      setSubmitting(true);
      await createLocalFormatConvertTask(file, {
        commandMode: draft.commandMode,
        presetId: draft.commandMode === 'preset' ? draft.presetId : undefined,
        target: {
          type: FormatConvertTargetType.DOWNLOAD,
          fileName: draft.targetFileName || getSuggestedTargetFileName(file.name, draft.option.outputFormat),
        },
        option: draft.option,
      });
      Toast.success(t('formatConvert.local.createSuccess'));
      onCreated();
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('formatConvert.error.createLocalFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title={t('formatConvert.local.title')} shadows="hover">
      <Space vertical align="start" style={{ width: '100%' }} spacing={16}>
        <div>
          <Typography.Text strong>{t('formatConvert.local.selectedFile')}</Typography.Text>
          <div style={{ marginTop: 8 }}>{file?.name || t('formatConvert.local.noFile')}</div>
        </div>
        <input
          type="file"
          accept="video/*,audio/*"
          onChange={event => {
            const nextFile = event.target.files?.[0] || null;
            setFile(nextFile);
            if (nextFile) {
              setDraft(current => ({
                ...current,
                targetFileName: getSuggestedTargetFileName(nextFile.name, current.option.outputFormat),
              }));
            }
          }}
        />
        <ConvertOptionForm draft={draft} onChange={setDraft} />
        <Button theme="solid" loading={submitting} onClick={onSubmit}>
          {t('formatConvert.local.submit')}
        </Button>
      </Space>
    </Card>
  );
}
