# AGENTS Rules

1. Only code files must contain at most 500 lines of code. Non-code files such as documentation, plans, specs, and other prose-heavy artifacts are not subject to this limit.
2. A single folder must contain at most 50 direct children (files and/or subfolders).
3. If a code file exceeds the line limit, split the code file. If a folder exceeds the child limit, split the folder structure.
4. Do not add unnecessary comments or explanatory text.
5. For any package update, automatically switch to the Node.js version specified in `.nvmrc` via `nvm` before installation.
6. Any newly added user-visible copy must be added to i18n resources; do not introduce new hardcoded UI or API text directly in code.
