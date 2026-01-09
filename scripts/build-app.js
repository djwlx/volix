#!/usr/bin/env node
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, opts = {}) {
  console.log('>', cmd);
  return execSync(cmd, Object.assign({ stdio: 'inherit' }, opts));
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const f of fs.readdirSync(src)) {
      copyRecursive(path.join(src, f), path.join(dest, f));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function sanitizeDeps(deps) {
  const out = {};
  if (!deps) return out;
  for (const k of Object.keys(deps)) {
    const v = deps[k];
    if (typeof v === 'string' && v.startsWith('workspace:')) continue;
    out[k] = v;
  }
  return out;
}

function packDist(target, dry) {
  const pkgPath = path.resolve(process.cwd(), target, 'package.json');
  const distDir = path.resolve(process.cwd(), target, 'dist');
  const outPkg = path.join(distDir, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    console.error('package.json not found at', pkgPath);
    process.exit(1);
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const minimal = {};
    const keep = ['name', 'version', 'description', 'license', 'author', 'engines'];
    for (const f of keep) if (pkg[f]) minimal[f] = pkg[f];

    let mainFile = pkg.main || 'app/app.ts';
    mainFile = mainFile.replace(/\.ts$/, '.js');
    minimal.main = mainFile;
    minimal.type = pkg.type || 'commonjs';
    minimal.scripts = { start: `node ${mainFile}` };
    minimal.dependencies = sanitizeDeps(pkg.dependencies || {});

    if (dry) {
      console.log('[dry] would write', outPkg);
      return;
    }

    fs.mkdirSync(distDir, { recursive: true });
    fs.writeFileSync(outPkg, JSON.stringify(minimal, null, 2) + '\n', 'utf8');
    console.log('Created', outPkg);
  } catch (err) {
    console.error('pack-dist failed:', err);
    process.exit(2);
  }
}

function findPackageByName(name, root) {
  function walk(dir) {
    for (const p of fs.readdirSync(dir)) {
      const full = path.join(dir, p);
      let st;
      try {
        st = fs.statSync(full);
      } catch (e) {
        continue;
      }
      if (st.isDirectory()) {
        const pkg = path.join(full, 'package.json');
        if (fs.existsSync(pkg)) {
          try {
            const j = JSON.parse(fs.readFileSync(pkg, 'utf8'));
            if (j.name === name) return full;
          } catch (e) {}
        }
        const found = walk(full);
        if (found) return found;
      }
    }
    return null;
  }
  return walk(root);
}

function usage() {
  console.log('Usage: build-app.js [--skip-install] [--target apps/api] [--dry-run]');
}

function findRepoRoot(start) {
  let dir = path.resolve(start || process.cwd());
  while (true) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml')) || fs.existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function main() {
  const argv = process.argv.slice(2);
  const opts = { skipInstall: false, target: null, dry: false, packOnly: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--skip-install') opts.skipInstall = true;
    else if (a === '--dry-run') opts.dry = true;
    else if (a === '--pack') opts.packOnly = true;
    else if ((a === '--target' || a === '-t') && argv[i + 1]) {
      opts.target = argv[i + 1];
      i++;
    } else if (a === '--help' || a === '-h') {
      usage();
      return;
    } else if (!a.startsWith('-')) {
      opts.target = a;
    }
  }

  const cwd = process.cwd();
  const repoRoot = findRepoRoot(cwd) || cwd;

  // If no explicit target provided and invoked from a package subdirectory, default to pack-only for that package
  if (opts.target == null && cwd !== repoRoot) {
    opts.packOnly = true;
    opts.target = path.relative(repoRoot, cwd) || '.';
  }

  const apiDir = path.resolve(repoRoot, opts.target || 'apps/api');
  const apiPkg = path.join(apiDir, 'package.json');
  if (!fs.existsSync(apiPkg)) {
    console.error('api package.json not found at', apiPkg);
    process.exit(1);
  }

  if (!opts.skipInstall) {
    if (opts.dry) console.log('[dry] would run: pnpm install');
    else run('pnpm install');
  }

  if (opts.dry) console.log('[dry] would run: pnpm -w -r build');
  else run('pnpm -w -r build');

  // If pack-only mode, only run pack step and exit
  if (opts.packOnly) {
    const packTarget = opts.target || 'apps/api';
    if (opts.dry) console.log('[dry] would run: pack-dist', packTarget);
    else packDist(packTarget, opts.dry);
    return;
  }

  const webName = '@volix/web-pc';
  if (opts.dry) console.log('[dry] would run: pnpm --filter', webName, 'run build');
  else run(`pnpm --filter ${webName} run build`);

  const webDist = path.resolve(repoRoot, 'apps/web-pc/dist');
  const apiPublic = path.resolve(apiDir, 'public');
  if (fs.existsSync(webDist)) {
    console.log('Copying frontend build to', apiPublic);
    if (!opts.dry) {
      fs.rmSync(apiPublic, { recursive: true, force: true });
      copyRecursive(webDist, apiPublic);
    }
  } else {
    console.warn('web-pc dist not found at', webDist);
  }

  if (opts.dry) console.log('[dry] would run: pnpm --filter @volix/api run build');
  else run('pnpm --filter @volix/api run build');

  const packTarget = opts.target || 'apps/api';
  if (opts.dry) console.log('[dry] would run: pack-dist', packTarget);
  else packDist(packTarget, opts.dry);

  const finalDist = path.resolve(repoRoot, 'dist');
  if (!opts.dry) fs.rmSync(finalDist, { recursive: true, force: true });
  fs.mkdirSync(finalDist, { recursive: true });

  const apiDist = path.resolve(apiDir, 'dist');
  if (!fs.existsSync(apiDist)) {
    console.error('api dist not found at', apiDist);
    process.exit(1);
  }

  console.log('Copying api dist to', finalDist);
  if (!opts.dry) copyRecursive(apiDist, finalDist);

  const pkgJson = JSON.parse(fs.readFileSync(apiPkg, 'utf8'));
  const workspaceDeps = [];
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const obj = pkgJson[field] || {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string' && v.startsWith('workspace:')) workspaceDeps.push(k);
    }
  }
  if (workspaceDeps.length) console.log('Vendor workspace packages:', workspaceDeps.join(', '));
  for (const name of workspaceDeps) {
    const pkgRoot = findPackageByName(name, repoRoot);
    if (!pkgRoot) {
      console.warn('Could not find package', name);
      continue;
    }
    const dest = path.join(finalDist, 'node_modules', name);
    console.log('Copying', pkgRoot, '->', dest);
    if (!opts.dry) copyRecursive(pkgRoot, dest);
  }

  // Install production dependencies within final dist so it's ready-to-run
  if (!opts.dry) {
    const pkgInDist = path.join(finalDist, 'package.json');
    if (fs.existsSync(pkgInDist)) {
      console.log('Installing production dependencies in', finalDist);
      try {
        run(`pnpm install --prod`, { cwd: finalDist });
      } catch (e) {
        console.error('Failed to install production dependencies in dist:', e && e.message);
      }
    } else {
      console.warn('No package.json found in dist; skipping install');
    }
  }

  console.log('\nDone. Final artifact is in ./dist');
  console.log('To run:');
  console.log('  cd dist');
  console.log('  node app/app.js');
}

if (require.main === module) main();
