import type { UserConfig, Rule } from '@commitlint/types';

const onlyEnglish: Rule = ({ subject }) => {
  if (!subject) {
    return [false, 'The submitted information cannot be empty'];
  }
  if (/^[A-Za-z0-9 ,.!?:;'"()-]+$/.test(subject)) {
    return [true];
  }
  return [false, 'The submitted information can only contain English and symbols'];
};

const commitLintConfig: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'chore', 'refactor', 'revert', 'docs', 'ci', 'style', 'test', 'delete', 'script'],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'header-max-length': [2, 'always', 100],
    'subject-english': [2, 'always'],
  },
  plugins: [
    {
      rules: {
        'subject-english': onlyEnglish,
      },
    },
  ],
};

module.exports = commitLintConfig;
