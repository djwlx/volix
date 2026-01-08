#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

const IGNORE = new Set(['node_modules', '.git', '.turbo', 'dist', 'build', 'coverage']);

async function findPackageJsons(dir) {
  const results = [];
  async function walk(current) {
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch (e) {
      return;
    }
    for (const ent of entries) {
      const full = path.join(current, ent.name);
      if (ent.isFile() && ent.name === 'package.json') {
        results.push(full);
      } else if (ent.isDirectory()) {
        if (IGNORE.has(ent.name)) continue;
        await walk(full);
      }
    }
  }
  await walk(dir);
  return results;
}

function usage() {
  console.log('\nUsage: node scripts/update_versions.js <new-version>');
  console.log('If <new-version> is omitted, the root package.json version is used.');
}

async function main() {
  const argv = process.argv.slice(2);
  let newVersion = argv[0];
  const rootPkgPath = path.join(process.cwd(), 'package.json');
  if (!newVersion) {
    try {
      const root = await fs.readFile(rootPkgPath, 'utf8');
      const rootJson = JSON.parse(root);
      newVersion = rootJson.version;
      if (!newVersion) {
        console.error('No version in root package.json. Please provide a version.');
        usage();
        process.exit(1);
      }
    } catch (e) {
      console.error('Failed to read root package.json. Provide a version argument.');
      usage();
      process.exit(1);
    }
  }

  const start = process.cwd();
  console.log('Searching for package.json files under', start);
  const files = await findPackageJsons(start);
  if (!files.length) {
    console.log('No package.json files found.');
    return;
  }

  let updated = 0;
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const json = JSON.parse(content);
      if (json.version === newVersion) continue;
      json.version = newVersion;
      await fs.writeFile(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
      console.log('Updated', file);
      updated++;
    } catch (e) {
      console.error('Failed to update', file, e.message);
    }
  }
  console.log(`\nDone. Updated ${updated} file(s). New version: ${newVersion}`);
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
