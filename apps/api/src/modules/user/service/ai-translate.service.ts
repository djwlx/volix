import type { TranslateTextPayload, TranslateTextResponse } from '@volix/types';
import { badRequest } from '../../shared/http-handler';
import { t } from '../../../utils/i18n';
import { createUserAiSdk } from './user-config.service';

const normalizeLanguage = (value: unknown, fallback: string) => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized || fallback;
};

const buildTranslationPrompt = (sourceLanguage: string, targetLanguage: string, text: string) => {
  return [
    `Source language: ${sourceLanguage}`,
    `Target language: ${targetLanguage}`,
    'Translate the text faithfully.',
    'Return only the translated text.',
    'Do not add explanations, markdown, or quotes.',
    '',
    text,
  ].join('\n');
};

export async function translateUserText(
  userId: string | number,
  payload: TranslateTextPayload
): Promise<TranslateTextResponse> {
  const text = normalizeLanguage(payload.text, '');
  const sourceLanguage = normalizeLanguage(payload.sourceLanguage, 'auto');
  const targetLanguage = normalizeLanguage(payload.targetLanguage, '');

  if (!text) {
    badRequest(t({ id: 'aiTranslate.validation.textRequired', defaultMessage: '请输入需要翻译的内容' }));
  }
  if (!targetLanguage) {
    badRequest(t({ id: 'aiTranslate.validation.targetLanguageRequired', defaultMessage: '请选择目标语言' }));
  }

  const { sdk } = await createUserAiSdk(userId);
  const translated = await sdk.chat([
    {
      role: 'system',
      content:
        'You are a translation engine. Preserve the original meaning and tone. Output only the translated result.',
    },
    {
      role: 'user',
      content: buildTranslationPrompt(sourceLanguage, targetLanguage, text),
    },
  ]);

  const result = translated.trim();
  if (!result) {
    badRequest(t({ id: 'aiTranslate.error.emptyResult', defaultMessage: '翻译结果为空，请稍后重试' }));
  }

  return {
    text: result,
  };
}
