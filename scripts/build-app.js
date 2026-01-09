#!/usr/bin/env node
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, opts = {}) {
  console.log('>', cmd);
  return execSync(cmd, Object.assign({ stdio: 'inherit' }, opts));
}
function copyDir(src, dest) {
  // 创建目标目录
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const files = fs.readdirSync(src);

  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

function copyFrontToEnd() {
  // 将 web-pc 的 dist 复制到 api 的 dist/public
  const webPcDistPath = path.resolve(__dirname, '..', 'apps/web-pc/dist');
  const apiPublicPath = path.resolve(__dirname, '..', 'apps/api/dist/public');

  if (fs.existsSync(webPcDistPath)) {
    console.log('> 复制 web-pc/dist 到 api/dist/public...');

    // 清空目标目录
    if (fs.existsSync(apiPublicPath)) {
      fs.rmSync(apiPublicPath, { recursive: true, force: true });
    }

    // 复制文件
    copyDir(webPcDistPath, apiPublicPath);
    console.log('✓ 复制完成');
  } else {
    console.warn('⚠ web-pc/dist 不存在，跳过复制步骤');
  }
}

function getWorkspacePackages() {
  // 读取 pnpm-workspace.yaml 找出所有 workspace 包的位置
  const workspaceFile = path.resolve(__dirname, '..', 'pnpm-workspace.yaml');
  const content = fs.readFileSync(workspaceFile, 'utf8');

  const packages = [];
  const patterns = content.match(/^\s*-\s+(.+)$/gm) || [];

  patterns.forEach(pattern => {
    const match = pattern.match(/^\s*-\s+(.+)$/);
    if (match) {
      const glob = match[1].trim();
      const baseDir = path.resolve(__dirname, '..', glob.replace('/*', ''));

      if (fs.existsSync(baseDir)) {
        const items = fs.readdirSync(baseDir);
        items.forEach(item => {
          const itemPath = path.join(baseDir, item);
          const stat = fs.statSync(itemPath);

          if (stat.isDirectory()) {
            const pkgJsonPath = path.join(itemPath, 'package.json');
            if (fs.existsSync(pkgJsonPath)) {
              const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
              packages.push({
                name: pkgJson.name,
                path: itemPath,
                version: pkgJson.version,
              });
            }
          }
        });
      }
    }
  });

  return packages;
}

function copyWorkspaceDependencies() {
  const apiPkgPath = path.resolve(__dirname, '..', 'apps/api/package.json');
  const apiDistPath = path.resolve(__dirname, '..', 'apps/api/dist');
  const apiDistNodeModulesPath = path.join(apiDistPath, 'node_modules');

  const apiPkg = JSON.parse(fs.readFileSync(apiPkgPath, 'utf8'));
  const workspacePackages = getWorkspacePackages();

  // 创建 dist/node_modules 目录
  if (!fs.existsSync(apiDistNodeModulesPath)) {
    fs.mkdirSync(apiDistNodeModulesPath, { recursive: true });
  }

  // 遍历 dependencies 和 devDependencies 中的 workspace:* 依赖
  const allDeps = { ...apiPkg.dependencies, ...apiPkg.devDependencies };

  Object.entries(allDeps).forEach(([depName, depVersion]) => {
    if (typeof depVersion === 'string' && depVersion.includes('workspace:')) {
      const pkg = workspacePackages.find(p => p.name === depName);
      if (pkg) {
        const distPath = path.join(pkg.path, 'dist');
        if (fs.existsSync(distPath)) {
          const destPath = path.join(apiDistNodeModulesPath, depName);
          console.log(`> 复制 workspace 依赖 ${depName}...`);

          if (fs.existsSync(destPath)) {
            fs.rmSync(destPath, { recursive: true, force: true });
          }

          copyDir(distPath, destPath);
        }
      }
    }
  });
}

function cleanupApiPackageJson() {
  const apiPkgPath = path.resolve(__dirname, '..', 'apps/api/package.json');
  const apiDistPath = path.resolve(__dirname, '..', 'apps/api/dist');
  const apiDistPkgPath = path.join(apiDistPath, 'package.json');

  console.log('> 复制并清理 package.json...');

  // 确保 dist 目录存在
  if (!fs.existsSync(apiDistPath)) {
    fs.mkdirSync(apiDistPath, { recursive: true });
  }

  // 读取原始 package.json
  const pkg = JSON.parse(fs.readFileSync(apiPkgPath, 'utf8'));

  // 只保留必要的字段
  const cleanedPkg = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    main: pkg.main,
    type: pkg.type,
    keywords: pkg.keywords,
    author: pkg.author,
    license: pkg.license,
    dependencies: pkg.dependencies,
  };

  // 删除 devDependencies
  delete cleanedPkg.devDependencies;

  // 更新 workspace:* 依赖为本地路径或版本
  if (cleanedPkg.dependencies) {
    Object.keys(cleanedPkg.dependencies).forEach(depName => {
      if (cleanedPkg.dependencies[depName].includes('workspace:')) {
        // 获取该包的版本号
        const workspacePackages = getWorkspacePackages();
        const pkg = workspacePackages.find(p => p.name === depName);
        if (pkg) {
          cleanedPkg.dependencies[depName] = `file:./node_modules/${depName}`;
        }
      }
    });
  }

  // 写入到 dist 目录
  fs.writeFileSync(apiDistPkgPath, JSON.stringify(cleanedPkg, null, 2) + '\n');
  console.log('✓ package.json 复制并清理完成');
}

function buildApp() {
  // run('npm install -g pnpm@10.27.0');
  // run('pnpm install');
  // run('pnpm run build');
  copyFrontToEnd();
  copyWorkspaceDependencies();
  cleanupApiPackageJson();
}

buildApp();
