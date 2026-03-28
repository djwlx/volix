import { getPackageMeta } from '../service/util.service';

export const testUtil: MyMiddleware = async () => {
  return {};
};

export const getPackageMetaJson: MyMiddleware = async () => {
  return getPackageMeta();
};

export const getPackageMetaHtml: MyMiddleware = async ctx => {
  const pkg = await getPackageMeta();
  ctx.set('Content-Type', 'text/html; charset=utf-8');
  ctx.body = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>Package Info</title>
  </head>
  <body>
    <h1>Package Info</h1>
    <pre>${JSON.stringify(pkg, null, 2)}</pre>
  </body>
</html>`;
};
