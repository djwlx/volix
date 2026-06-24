#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const API_DIR = path.join(ROOT, 'apps/api');
const API_DIST = path.join(API_DIR, 'dist');
const WEB_DIST = path.join(ROOT, 'apps/web-pc/dist');
const PACKAGES_DIR = path.join(ROOT, 'packages');
const OUT = path.join(ROOT, 'dist');

const RUNTIME_SCRIPTS = ['start', 'db:migrate', 'db:migrate:undo'];

function run(cmd) {
  console.log('>', cmd);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
}

function rmrf(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.cpSync(src, dest, { recursive: true });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

function cleanAllDist() {
  console.log('> 清理所有 dist 目录...');
  rmrf(OUT);
  for (const group of ['apps', 'packages']) {
    const base = path.join(ROOT, group);
    if (!fs.existsSync(base)) continue;
    for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        rmrf(path.join(base, entry.name, 'dist'));
      }
    }
  }
}

function buildAll() {
  run('npm install -g pnpm@8.15.9');
  run('pnpm install --frozen-lockfile');
  run('pnpm run build');
}

function mapWorkspacePackages() {
  const map = new Map();
  for (const name of fs.readdirSync(PACKAGES_DIR)) {
    const pkgJson = path.join(PACKAGES_DIR, name, 'package.json');
    if (fs.existsSync(pkgJson)) {
      map.set(readJson(pkgJson).name, path.join(PACKAGES_DIR, name));
    }
  }
  return map;
}

function assembleApiOutput() {
  // 兼容扁平 (dist/app.js) 与嵌套 (dist/apps/api/app.js) 两种 tsc 输出
  const nested = path.join(API_DIST, 'apps', 'api');
  const compiledRoot = fs.existsSync(nested) ? nested : API_DIST;

  console.log('> 复制 API 编译产物...');
  for (const entry of fs.readdirSync(compiledRoot)) {
    if (['node_modules', 'public', 'package.json'].includes(entry)) continue;
    const src = path.join(compiledRoot, entry);
    const dest = path.join(OUT, entry);
    if (fs.statSync(src).isDirectory()) {
      copyDir(src, dest);
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }
  }

  console.log('> 复制 migrations 与 sequelize-cli 配置...');
  copyDir(path.join(API_DIR, 'migrations'), path.join(OUT, 'migrations'));
  const seqCli = path.join(API_DIR, 'config', 'sequelize-cli.cjs');
  if (fs.existsSync(seqCli)) {
    fs.mkdirSync(path.join(OUT, 'config'), { recursive: true });
    fs.copyFileSync(seqCli, path.join(OUT, 'config', 'sequelize-cli.cjs'));
  }

  if (fs.existsSync(WEB_DIST)) {
    console.log('> 复制前端产物到 public...');
    copyDir(WEB_DIST, path.join(OUT, 'public'));
  } else {
    console.warn('⚠ web-pc/dist 不存在，跳过前端复制');
  }
}

// 把 workspace 包以 npm file: 依赖的形式 vendored 到 dist/vendor/<name>
function vendorWorkspacePackages(apiPkg) {
  const wsPackages = mapWorkspacePackages();
  const allDeps = { ...apiPkg.dependencies, ...apiPkg.devDependencies };
  const fileDeps = {};

  for (const [name, version] of Object.entries(allDeps)) {
    if (typeof version !== 'string' || !version.startsWith('workspace:')) continue;

    const srcDir = wsPackages.get(name);
    if (!srcDir) {
      console.warn(`⚠ 未找到 workspace 包 ${name}，跳过`);
      continue;
    }

    const shortName = name.split('/').pop();
    const destDir = path.join(OUT, 'vendor', shortName);
    console.log(`> vendored 工作区包 ${name} -> vendor/${shortName}`);

    copyDir(path.join(srcDir, 'dist'), path.join(destDir, 'dist'));

    const pkg = readJson(path.join(srcDir, 'package.json'));
    delete pkg.scripts;
    delete pkg.devDependencies;
    delete pkg.files;
    delete pkg.private;
    if (pkg.exports && pkg.exports['.'] && pkg.exports['.'].development) {
      delete pkg.exports['.'].development;
    }
    writeJson(path.join(destDir, 'package.json'), pkg);

    fileDeps[name] = `file:./vendor/${shortName}`;
  }

  return fileDeps;
}

function writeOutputPackageJson(apiPkg, fileDeps) {
  console.log('> 生成产物 package.json...');

  const dependencies = {};
  for (const [name, version] of Object.entries(apiPkg.dependencies || {})) {
    if (typeof version === 'string' && version.startsWith('workspace:')) continue;
    dependencies[name] = version;
  }
  Object.assign(dependencies, fileDeps);

  const scripts = {};
  for (const name of RUNTIME_SCRIPTS) {
    if (apiPkg.scripts && apiPkg.scripts[name]) scripts[name] = apiPkg.scripts[name];
  }

  writeJson(path.join(OUT, 'package.json'), {
    name: apiPkg.name,
    version: apiPkg.version,
    description: apiPkg.description,
    main: 'app.js',
    type: apiPkg.type,
    keywords: apiPkg.keywords,
    author: apiPkg.author,
    license: apiPkg.license,
    dependencies,
    scripts,
  });
}

function releaseApp() {
  cleanAllDist();
  buildAll();
  fs.mkdirSync(OUT, { recursive: true });

  const apiPkg = readJson(path.join(API_DIR, 'package.json'));
  assembleApiOutput();
  const fileDeps = vendorWorkspacePackages(apiPkg);
  writeOutputPackageJson(apiPkg, fileDeps);

  console.log('✓ 打包完成：dist/ 可直接 npm install && npm start');
}

releaseApp();
