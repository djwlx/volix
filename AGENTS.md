# AGENTS Rules

1. A single file must contain at most 500 lines of code, except i18n resource files such as `packages/i18n/src/locales/*/translation.json`.
2. A single folder must contain at most 50 direct children (files and/or subfolders).
3. If either limit is exceeded, split the file or split the folder structure.
4. Do not add unnecessary comments or explanatory text.
5. For any package update, automatically switch to the Node.js version specified in `.nvmrc` via `nvm` before installation.
6. Any newly added user-visible copy must be added to i18n resources; do not introduce new hardcoded UI or API text directly in code.
