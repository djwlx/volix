import { FormatConvertEngine, FormatConvertMode } from '@volix/types';

export type ConvertSourceKind = 'local-upload' | 'cloud-openlist';

export interface ConvertTypeConfig {
  id: string;
  labelKey: string;
  mode: FormatConvertMode;
  engine: FormatConvertEngine;
  sourceKind: ConvertSourceKind;
  uploadAccept?: string;
}

export const CONVERT_TYPES: ConvertTypeConfig[] = [
  {
    id: 'local-media',
    labelKey: 'formatConvert.sourcePicker.localVideo',
    mode: FormatConvertMode.LOCAL,
    engine: FormatConvertEngine.MEDIA,
    sourceKind: 'local-upload',
    uploadAccept: 'video/*,audio/*',
  },
  {
    id: 'cloud-media',
    labelKey: 'formatConvert.sourcePicker.cloudVideo',
    mode: FormatConvertMode.CLOUD,
    engine: FormatConvertEngine.MEDIA,
    sourceKind: 'cloud-openlist',
  },
  {
    id: 'local-image',
    labelKey: 'formatConvert.sourcePicker.localImage',
    mode: FormatConvertMode.LOCAL,
    engine: FormatConvertEngine.IMAGE,
    sourceKind: 'local-upload',
    uploadAccept: 'image/*',
  },
  {
    id: 'local-comic-metadata',
    labelKey: 'formatConvert.sourcePicker.localComicMetadata',
    mode: FormatConvertMode.LOCAL,
    engine: FormatConvertEngine.COMIC,
    sourceKind: 'local-upload',
    uploadAccept: '.cbz,.zip,application/zip',
  },
];

export const listConvertTypes = () => CONVERT_TYPES;

export const getConvertType = (id?: string) => CONVERT_TYPES.find(item => item.id === id);
