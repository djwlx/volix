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

  // 递归复制，只允许复制 package.json 和 dist 文件夹
  function copyDirFiltered(src, dest, options = {}) {
    const allow = options.allow || ['package.json', 'dist'];

    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const files = fs.readdirSync(src);

    files.forEach(file => {
      // 只在顶层目录应用白名单
      if (options.isRoot && !allow.includes(file)) {
        return;
      }

      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      const stat = fs.statSync(srcPath);

      if (stat.isDirectory()) {
        // 递归复制子目录，不应用白名单
        copyDirFiltered(srcPath, destPath, { ...options, isRoot: false });
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }

  // 遍历 dependencies 和 devDependencies 中的 workspace:* 依赖
  const allDeps = { ...apiPkg.dependencies, ...apiPkg.devDependencies };

  Object.entries(allDeps).forEach(([depName, depVersion]) => {
    if (typeof depVersion === 'string' && depVersion.includes('workspace:')) {
      const pkg = workspacePackages.find(p => p.name === depName);
      if (pkg) {
        const srcPkgPath = pkg.path;
        const destPath = path.join(apiDistNodeModulesPath, depName);
        console.log(`> 复制 workspace 依赖 ${depName}（保留包内结构）...`);

        try {
          if (fs.existsSync(destPath)) {
            fs.rmSync(destPath, { recursive: true, force: true });
          }

          // 优先复制整个包的原始结构（只复制 package.json 和 dist）
          copyDirFiltered(srcPkgPath, destPath, { isRoot: true });

          // 如果 package.json 在源目录中，则确保存在（copyDirFiltered 会复制），否则尝试复制
          const srcPkgJson = path.join(pkg.path, 'package.json');
          const destPkgJson = path.join(destPath, 'package.json');
          if (fs.existsSync(srcPkgJson) && !fs.existsSync(destPkgJson)) {
            fs.copyFileSync(srcPkgJson, destPkgJson);
          }
        } catch (e) {
          console.warn(`⚠ 无法复制 ${depName} 到 ${destPath}: ${e.message}`);
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

  // 移除 workspace:* 类型的依赖（由打包时复制的包提供）
  if (cleanedPkg.dependencies) {
    Object.keys(cleanedPkg.dependencies).forEach(depName => {
      const v = cleanedPkg.dependencies[depName];
      if (typeof v === 'string' && v.includes('workspace:')) {
        delete cleanedPkg.dependencies[depName];
      }
    });
  }

  // 保留 start 脚本（如果存在）
  if (pkg.scripts && pkg.scripts.start) {
    cleanedPkg.scripts = { start: pkg.scripts.start };
  }

  // 写入到 dist 目录
  fs.writeFileSync(apiDistPkgPath, JSON.stringify(cleanedPkg, null, 2) + '\n');
  console.log('✓ package.json 复制并清理完成');
}

function copyApiDistToRoot() {
  const apiDistPath = path.resolve(__dirname, '..', 'apps/api/dist');
  const rootDistPath = path.resolve(__dirname, '..', 'dist');

  if (!fs.existsSync(apiDistPath)) {
    console.warn('⚠ apps/api/dist 不存在，跳过复制到根目录');
    return;
  }

  console.log('> 复制 apps/api/dist 到 根目录 dist...');

  // 清空根目录 dist
  if (fs.existsSync(rootDistPath)) {
    fs.rmSync(rootDistPath, { recursive: true, force: true });
  }

  // 递归复制
  copyDir(apiDistPath, rootDistPath);

  console.log('✓ 复制到根目录 dist 完成');
}

function removeAllDist() {
  const root = path.resolve(__dirname, '..');
  console.log('> 清理所有 dist 目录以防缓存...');

  // 根目录 dist
  const rootDist = path.join(root, 'dist');
  if (fs.existsSync(rootDist)) {
    fs.rmSync(rootDist, { recursive: true, force: true });
    console.log(`  删除 ${rootDist}`);
  }

  // apps/*/dist
  const appsDir = path.join(root, 'apps');
  if (fs.existsSync(appsDir)) {
    fs.readdirSync(appsDir).forEach(name => {
      const d = path.join(appsDir, name, 'dist');
      if (fs.existsSync(d)) {
        fs.rmSync(d, { recursive: true, force: true });
        console.log(`  删除 ${d}`);
      }
    });
  }

  // packages/*/dist
  const packagesDir = path.join(root, 'packages');
  if (fs.existsSync(packagesDir)) {
    fs.readdirSync(packagesDir).forEach(name => {
      const d = path.join(packagesDir, name, 'dist');
      if (fs.existsSync(d)) {
        fs.rmSync(d, { recursive: true, force: true });
        console.log(`  删除 ${d}`);
      }
    });
  }

  console.log('✓ 所有 dist 已清理');
}

function buildApp() {
  removeAllDist();
  run('npm install -g pnpm@8.15.9');
  run('pnpm config set allow-build-scripts true');
  run('pnpm install');
  run('pnpm run release');
  copyFrontToEnd();
  copyWorkspaceDependencies();
  cleanupApiPackageJson();
  copyApiDistToRoot();
}

buildApp();
