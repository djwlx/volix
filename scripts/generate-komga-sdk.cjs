const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const sourcePath = path.join(rootDir, 'docs/openapi/komga.openapi.json');
const outputDir = path.join(rootDir, 'apps/api/src/sdk/komga/generated');

const tagToFileName = tag =>
  String(tag || 'untagged')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untagged';

const loadDoc = () => JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const pickPathParamNames = pathTemplate =>
  Array.from(String(pathTemplate).matchAll(/\{([^}]+)\}/g)).map(match => match[1]).filter(Boolean);

const getRequiresAuth = (doc, operation) => {
  const security = operation.security === undefined ? doc.security : operation.security;
  return Array.isArray(security) && security.length > 0;
};

const getPreferredContentType = operation => {
  const content = operation.requestBody && operation.requestBody.content;
  if (!content || typeof content !== 'object') {
    return undefined;
  }

  const supported = [
    'application/json',
    'multipart/form-data',
    'application/x-www-form-urlencoded',
    'text/plain',
  ];
  return supported.find(type => content[type]) || Object.keys(content)[0];
};

const buildOperationsByTag = doc => {
  const grouped = new Map();

  Object.entries(doc.paths || {}).forEach(([urlPath, methods]) => {
    Object.entries(methods || {}).forEach(([method, operation]) => {
      if (!operation || typeof operation !== 'object') {
        return;
      }

      const operationId = String(operation.operationId || '').trim();
      if (!operationId) {
        return;
      }

      const tag = String((operation.tags && operation.tags[0]) || 'Untagged');
      const list = grouped.get(tag) || [];
      list.push({
        operationId,
        method: String(method || 'get').toUpperCase(),
        path: urlPath,
        tag,
        requiresAuth: getRequiresAuth(doc, operation),
        pathParams: pickPathParamNames(urlPath),
        contentType: getPreferredContentType(operation),
      });
      grouped.set(tag, list);
    });
  });

  return grouped;
};

const renderTagFile = (tag, operations) => {
  const constName = `${tagToFileName(tag).replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase())}KomgaOperations`;
  const body = operations
    .sort((left, right) => left.operationId.localeCompare(right.operationId))
    .map(
      item =>
        `  ${JSON.stringify(item.operationId)}: { method: ${JSON.stringify(item.method)}, path: ${JSON.stringify(
          item.path
        )}, tag: ${JSON.stringify(item.tag)}, requiresAuth: ${item.requiresAuth ? 'true' : 'false'}, pathParams: [${
          item.pathParams.map(name => JSON.stringify(name)).join(', ')
        }]${item.contentType ? `, contentType: ${JSON.stringify(item.contentType)}` : ''} },`
    )
    .join('\n');

  return `import type { KomgaOperationDefinitionMap } from '../core/komga.types';\n\nexport const ${constName} = {\n${body}\n} as const satisfies KomgaOperationDefinitionMap;\n`;
};

const renderIndexFile = grouped => {
  const imports = [];
  const spreads = [];

  Array.from(grouped.keys())
    .sort((left, right) => left.localeCompare(right))
    .forEach(tag => {
      const fileName = tagToFileName(tag);
      const constName = `${fileName.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase())}KomgaOperations`;
      imports.push(`import { ${constName} } from './${fileName}';`);
      spreads.push(`  ...${constName},`);
    });

  return `${imports.join('\n')}\n\nexport const komgaOperationDefinitions = {\n${spreads.join('\n')}\n} as const;\n\nexport type KomgaOperationId = keyof typeof komgaOperationDefinitions;\n`;
};

const writeFile = (filePath, content) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

const main = () => {
  const doc = loadDoc();
  const grouped = buildOperationsByTag(doc);

  fs.rmSync(outputDir, { recursive: true, force: true });

  grouped.forEach((operations, tag) => {
    writeFile(path.join(outputDir, `${tagToFileName(tag)}.ts`), renderTagFile(tag, operations));
  });

  writeFile(path.join(outputDir, 'index.ts'), renderIndexFile(grouped));
  console.log(`Generated Komga SDK metadata for ${Array.from(grouped.values()).flat().length} operations.`);
};

main();
