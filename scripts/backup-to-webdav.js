#!/usr/bin/env node
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { execSync } = require('child_process');

function escapeShellArg(s) {
  return `'${String(s).replace(/'/g, "'\\''")}'`;
}

function humanSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  const units = ['KB', 'MB', 'GB', 'TB'];
  let i = -1;
  do {
    bytes = bytes / 1024;
    i++;
  } while (bytes >= 1024 && i < units.length - 1);
  return bytes.toFixed(1) + ' ' + units[i];
}

function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch (e) {
    // ignore if file not exist
  }
}

async function main() {
  // load env files if present
  loadEnvFile('.env');
  loadEnvFile('.env.local');

  const DATA_PATH = process.env.DATA_PATH;
  if (!DATA_PATH) {
    console.error('DATA_PATH is not set in environment or .env');
    process.exit(2);
  }

  const WEBDAV_URL = process.env.WEBDAV_URL || 'http://localhost:5244/dav/115网盘/其他/docker备份';
  const WEBDAV_USER = process.env.WEBDAV_USER || process.env.WEBDAV_USERNAME || 'admin';
  const WEBDAV_PASSWORD = process.env.WEBDAV_PASSWORD || process.env.WEBDAV_PASS || '';

  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(
    now.getMinutes()
  )}${pad(now.getSeconds())}`;

  const zipName = `docker-data-${dateStr}.tar.gz`;
  const fatherPath = path.dirname(DATA_PATH);
  const zipPath = path.join(fatherPath, zipName);
  const base = path.basename(DATA_PATH);

  console.log('Packing', DATA_PATH, '->', zipPath);
  try {
    // tar -czf $ZIP_PATH $(basename $DATA_PATH) from fatherPath
    const cmd = `tar -czf ${escapeShellArg(zipPath)} -C ${escapeShellArg(fatherPath)} ${escapeShellArg(base)}`;
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.error('tar failed:', e.message);
    process.exit(3);
  }

  try {
    const stat = await fsp.stat(zipPath);
    console.log('\nUploading', zipPath, 'size', humanSize(stat.size));
  } catch (e) {
    console.error('Failed to stat zip file:', e.message);
  }

  try {
    const uploadCmd = `curl -sS -u ${escapeShellArg(WEBDAV_USER + ':' + WEBDAV_PASSWORD)} -T ${escapeShellArg(
      zipPath
    )} ${escapeShellArg(WEBDAV_URL + '/' + zipName)}`;
    execSync(uploadCmd, { stdio: 'inherit' });
    const st = await fsp.stat(zipPath);
    console.log(`\n备份完成 ${humanSize(st.size)}`);
  } catch (e) {
    console.error('Upload failed:', e.message);
    // keep the archive so user can inspect
    process.exit(4);
  }

  try {
    await fsp.unlink(zipPath);
  } catch (e) {
    // ignore
  }

  // Note: container stop/start steps are intentionally omitted. If needed, implement docker compose calls here.
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
