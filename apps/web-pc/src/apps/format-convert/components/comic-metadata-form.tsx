import { Checkbox, Input, InputNumber, Select, Space, TagInput, TextArea, Typography } from '@douyinfe/semi-ui';
import type { FormatComicInfo } from '@volix/types';
import type { CSSProperties, ReactElement } from 'react';
import { useI18n } from '@/i18n';
import type { ComicMetadataDraft } from '../comic-metadata';
import styles from './workbench.module.scss';

interface ComicMetadataFormProps {
  disableActions?: boolean;
  draft: ComicMetadataDraft;
  onChange: (draft: ComicMetadataDraft) => void;
}

const textFields: Array<{ key: keyof FormatComicInfo; labelKey: string }> = [
  { key: 'title', labelKey: 'formatConvert.comic.form.title' },
  { key: 'series', labelKey: 'formatConvert.comic.form.series' },
  { key: 'number', labelKey: 'formatConvert.comic.form.number' },
  { key: 'volume', labelKey: 'formatConvert.comic.form.volume' },
  { key: 'writer', labelKey: 'formatConvert.comic.form.writer' },
  { key: 'penciller', labelKey: 'formatConvert.comic.form.penciller' },
  { key: 'inker', labelKey: 'formatConvert.comic.form.inker' },
  { key: 'colorist', labelKey: 'formatConvert.comic.form.colorist' },
  { key: 'letterer', labelKey: 'formatConvert.comic.form.letterer' },
  { key: 'publisher', labelKey: 'formatConvert.comic.form.publisher' },
  { key: 'ageRating', labelKey: 'formatConvert.comic.form.ageRating' },
  { key: 'languageISO', labelKey: 'formatConvert.comic.form.languageISO' },
  { key: 'storyArc', labelKey: 'formatConvert.comic.form.storyArc' },
  { key: 'seriesGroup', labelKey: 'formatConvert.comic.form.seriesGroup' },
];

const tagFields: Array<{ key: keyof FormatComicInfo; labelKey: string }> = [
  { key: 'genres', labelKey: 'formatConvert.comic.form.genres' },
  { key: 'tags', labelKey: 'formatConvert.comic.form.tags' },
  { key: 'characters', labelKey: 'formatConvert.comic.form.characters' },
  { key: 'teams', labelKey: 'formatConvert.comic.form.teams' },
  { key: 'locations', labelKey: 'formatConvert.comic.form.locations' },
];

const mangaOptions = ['Unknown', 'No', 'Yes', 'YesAndRightToLeft'].map(value => ({ value, label: value }));
const MangaSelect = Select as unknown as (props: {
  disabled?: boolean;
  optionList: Array<{ label: string; value: string }>;
  style?: CSSProperties;
  value?: string;
  onChange: (value?: string) => void;
}) => ReactElement;

const patchMetadata = (draft: ComicMetadataDraft, patch: Partial<FormatComicInfo>): ComicMetadataDraft => ({
  ...draft,
  metadata: { ...draft.metadata, ...patch },
});

export function ComicMetadataForm(props: ComicMetadataFormProps) {
  const { disableActions, draft, onChange } = props;
  const { t } = useI18n();

  return (
    <Space vertical spacing={16} align="start" style={{ width: '100%' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          width: '100%',
        }}
      >
        {textFields.map(field => (
          <div key={String(field.key)} style={{ width: '100%' }}>
            <div className={styles.sectionLabel}>{t(field.labelKey)}</div>
            <Input
              disabled={disableActions}
              value={String(draft.metadata[field.key] || '')}
              style={{ marginTop: 8 }}
              onChange={value => onChange(patchMetadata(draft, { [field.key]: value }))}
            />
          </div>
        ))}

        <div style={{ width: '100%' }}>
          <div className={styles.sectionLabel}>{t('formatConvert.comic.form.manga')}</div>
          <MangaSelect
            disabled={disableActions}
            optionList={mangaOptions}
            style={{ marginTop: 8, width: '100%' }}
            value={draft.metadata.manga || 'Unknown'}
            onChange={value => onChange(patchMetadata(draft, { manga: String(value || 'Unknown') as never }))}
          />
        </div>

        <div style={{ width: '100%' }}>
          <div className={styles.sectionLabel}>{t('formatConvert.comic.form.year')}</div>
          <InputNumber
            disabled={disableActions}
            style={{ marginTop: 8, width: '100%' }}
            value={draft.metadata.year}
            onChange={value => onChange(patchMetadata(draft, { year: Number(value || 0) || undefined }))}
          />
        </div>

        <div style={{ width: '100%' }}>
          <div className={styles.sectionLabel}>{t('formatConvert.comic.form.month')}</div>
          <InputNumber
            disabled={disableActions}
            max={12}
            min={1}
            style={{ marginTop: 8, width: '100%' }}
            value={draft.metadata.month}
            onChange={value => onChange(patchMetadata(draft, { month: Number(value || 0) || undefined }))}
          />
        </div>

        <div style={{ width: '100%' }}>
          <div className={styles.sectionLabel}>{t('formatConvert.comic.form.day')}</div>
          <InputNumber
            disabled={disableActions}
            max={31}
            min={1}
            style={{ marginTop: 8, width: '100%' }}
            value={draft.metadata.day}
            onChange={value => onChange(patchMetadata(draft, { day: Number(value || 0) || undefined }))}
          />
        </div>
      </div>

      <div style={{ width: '100%' }}>
        <div className={styles.sectionLabel}>{t('formatConvert.comic.form.summary')}</div>
        <TextArea
          disabled={disableActions}
          autosize={{ minRows: 3, maxRows: 6 }}
          style={{ marginTop: 8 }}
          value={draft.metadata.summary || ''}
          onChange={(value: string) => onChange(patchMetadata(draft, { summary: value }))}
        />
      </div>

      <div style={{ width: '100%' }}>
        <div className={styles.sectionLabel}>{t('formatConvert.comic.form.notes')}</div>
        <TextArea
          disabled={disableActions}
          autosize={{ minRows: 2, maxRows: 5 }}
          style={{ marginTop: 8 }}
          value={draft.metadata.notes || ''}
          onChange={(value: string) => onChange(patchMetadata(draft, { notes: value }))}
        />
      </div>

      {tagFields.map(field => (
        <div key={String(field.key)} style={{ width: '100%' }}>
          <Typography.Text type="secondary">{t(field.labelKey)}</Typography.Text>
          <TagInput
            addOnBlur
            disabled={disableActions}
            style={{ marginTop: 8, width: '100%' }}
            value={(draft.metadata[field.key] as string[] | undefined) || []}
            onChange={value => onChange(patchMetadata(draft, { [field.key]: value }))}
          />
        </div>
      ))}

      <Checkbox
        checked={Boolean(draft.metadata.blackAndWhite)}
        disabled={disableActions}
        onChange={event => onChange(patchMetadata(draft, { blackAndWhite: event.target.checked }))}
      >
        {t('formatConvert.comic.form.blackAndWhite')}
      </Checkbox>
    </Space>
  );
}
