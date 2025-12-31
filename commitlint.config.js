module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'refactor', 'chore']],
    'type-case': [2, 'always', 'lower-case'],
    'header-pattern': [2, 'always', /^(\w+):\s.+$/],
    'header-max-length': [2, 'always', 100],
  },
};
