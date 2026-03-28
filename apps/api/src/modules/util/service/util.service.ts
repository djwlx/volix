import fs from 'fs/promises';
import path from 'path';
import { PATH } from '../../../utils/path';

export interface PackageMeta {
  name: string;
  version: string;
}

export async function getPackageMeta(): Promise<PackageMeta> {
  const packageJsonPath = path.join(PATH.root, 'package.json');
  const content = await fs.readFile(packageJsonPath, 'utf-8');
  const pkg = JSON.parse(content) as Partial<PackageMeta>;

  return {
    name: pkg.name || '',
    version: pkg.version || '',
  };
}
