import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  convertImageFile,
  probeImageFile,
} from '../../apps/api/src/modules/format-convert/service/format-convert-image.service';

const SOURCE_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAMgAAABkCAIAAABM5OhcAAAACXBIWXMAAAPoAAAD6AG1e1JrAAACCklEQVR4nO2UAQnAQACE1slOS/uhVmJDdggmOOUu7hMtwNsZXG3aAnxwLoVVWKewiuD85V97LN8BixSW74BFCst3wCKF5TtgkcLyHbBIYfkOWKSwfAcsUli+AxYpLN8BixSW74BFCst3wCKF5TtgkcLyHbBIYfkOWKSwfAcsUli+AxYpLN8BixSW74BFCst3wCKF5TtgkcLyHbBIYfkOWKSwfAcsUli+AxYpLN8BixSW74BFCst3wCKF5TtgkcLyHbBIYfkOWKSwfAcsUli+AxYpLN8BixSW74BFCst3wCKF5TtgkcLyHbBIYfkOWKSwfAcsUli+AxYpLN8BixSW74BFCst3wCKF5TtgkcLyHbBIYfkOWKSwfAcsUli+AxYpLN8BixSW74BFCst3wCKF5TtgkcLyHbBIYfkOWKSwfAcsUli+AxYpLN8BixSW74BFCst3wCKF5TtgkcLyHbBIYfkOWKSwfAcsUli+AxYpLN8BixSW74BFCst3wCKF5TtgkcLyHbBIYfkOWKSwfAcsUli+AxYpLN8BixSW74BFCst3wCKF5TtgkcLyHbBIYfkOWKSwfAcsUli+AxYpLN8BixSW74BFCst3wCKF5TtgkcLyHbBIYfkOWKSwfAcsUli+AxYpLN8BixSW74BFCst3wCKF5TtgkcLyHbBIYfkOWKSwfAcsUli+AxYpLN8BixSW74BFCst3wCKF5TtgkcLyHbBIYfkOWKSwfAcsUli+AxZ5ALj9+PUR3IHNAAAAAElFTkSuQmCC';

const tmpDir = path.join(os.tmpdir(), `volix-image-convert-${Date.now()}`);
const sourcePath = path.join(tmpDir, 'source.png');

beforeAll(async () => {
  await fs.promises.mkdir(tmpDir, { recursive: true });
  await fs.promises.writeFile(sourcePath, Buffer.from(SOURCE_PNG_BASE64, 'base64'));
});

afterAll(async () => {
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe('format convert image service', () => {
  it('probes width/height/format/size', async () => {
    const info = await probeImageFile(sourcePath);
    expect(info.width).toBe(200);
    expect(info.height).toBe(100);
    expect(info.format).toBe('png');
    expect(info.sizeBytes).toBeGreaterThan(0);
  });

  it('converts to webp and resizes width', async () => {
    const outputPath = path.join(tmpDir, 'out.webp');
    await convertImageFile(sourcePath, outputPath, { outputFormat: 'webp', quality: 80, width: 100 });
    const info = await probeImageFile(outputPath);
    expect(info.format).toBe('webp');
    expect(info.width).toBe(100);
    expect(info.height).toBe(50);
  });
});
