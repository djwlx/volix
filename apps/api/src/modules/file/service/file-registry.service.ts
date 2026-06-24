import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { Op } from 'sequelize';
import { PATH } from '../../../utils/path';
import { LocalFileEntity, LocalFileModel } from '../model/local-file.model';
import { generateFileId } from './file-id';

const FILE_URL_PREFIX = '/api/file';
const MAX_ID_ATTEMPTS = 5;

export type FileModule = 'upload' | 'rss' | '115' | 'format-convert';

export interface RegisterFileParams {
  userId: string | number;
  absolutePath: string;
  originalName: string;
  dirKey?: string | null;
  module: FileModule;
  visibility?: 'public' | 'private';
  metadata?: Record<string, unknown>;
}

export interface ResolvedLocalFile {
  id: string;
  absolutePath: string;
  originalName: string;
  mimeType: string;
  extension: string | null;
  size: number | null;
  userId: string;
  visibility: string;
}

export const buildFileUrl = (id: string): string => `${FILE_URL_PREFIX}/${id}`;

const toRelativePath = (absolutePath: string): string => {
  const resolved = path.resolve(absolutePath);
  const relative = path.relative(PATH.root, resolved);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`file-registry: path escapes root: ${absolutePath}`);
  }
  return relative.split(path.sep).join('/');
};

const toAbsolutePath = (relativePath: string): string | null => {
  const resolved = path.resolve(PATH.root, relativePath);
  const relative = path.relative(PATH.root, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }
  return resolved;
};

const isUniqueIdError = (error: unknown): boolean => {
  const name = (error as { name?: string })?.name;
  return name === 'SequelizeUniqueConstraintError';
};

const resolveExtension = (originalName: string): string | null => {
  const ext = path.extname(originalName).replace(/^\./, '').toLowerCase();
  return ext || null;
};

const resolveMimeType = (originalName: string, absolutePath: string): string | null => {
  return mime.lookup(originalName) || mime.lookup(absolutePath) || null;
};

export const registerFile = async (params: RegisterFileParams): Promise<{ id: string; url: string }> => {
  const relativePath = toRelativePath(params.absolutePath);
  const stat = await fs.promises.stat(params.absolutePath);

  const payload: Omit<LocalFileEntity, 'id'> = {
    user_id: String(params.userId),
    dir_key: params.dirKey ?? null,
    module: params.module,
    relative_path: relativePath,
    original_name: params.originalName,
    extension: resolveExtension(params.originalName),
    mime_type: resolveMimeType(params.originalName, params.absolutePath),
    size: stat.size,
    visibility: params.visibility || 'public',
    checksum: null,
    metadata_json: JSON.stringify(params.metadata || {}),
    status: 'active',
    expires_at: null,
  };

  for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt += 1) {
    const id = generateFileId();
    try {
      await LocalFileModel.create({ id, ...payload });
      return { id, url: buildFileUrl(id) };
    } catch (error) {
      if (isUniqueIdError(error)) {
        continue;
      }
      throw error;
    }
  }

  throw new Error('file-registry: failed to allocate unique id');
};

export const registerOrGetFileByPath = async (params: RegisterFileParams): Promise<{ id: string; url: string }> => {
  const relativePath = toRelativePath(params.absolutePath);
  const existing = await LocalFileModel.findOne({
    where: { user_id: String(params.userId), relative_path: relativePath, status: 'active' },
  });

  if (existing) {
    const id = existing.get('id') as string;
    return { id, url: buildFileUrl(id) };
  }

  return registerFile(params);
};

export const resolveFile = async (id: string): Promise<ResolvedLocalFile | null> => {
  const row = await LocalFileModel.findOne({ where: { id, status: 'active' } });
  if (!row) {
    return null;
  }

  const data = row.get();
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return null;
  }

  const absolutePath = toAbsolutePath(data.relative_path);
  if (!absolutePath) {
    return null;
  }

  const stat = await fs.promises.stat(absolutePath).catch(() => null);
  if (!stat?.isFile()) {
    return null;
  }

  return {
    id,
    absolutePath,
    originalName: data.original_name,
    mimeType: data.mime_type || 'application/octet-stream',
    extension: data.extension ?? null,
    size: data.size ?? null,
    userId: data.user_id,
    visibility: data.visibility,
  };
};

export const removeFileById = async (id: string, deleteFromDisk = true): Promise<void> => {
  const row = await LocalFileModel.findOne({ where: { id } });
  if (!row) {
    return;
  }
  if (deleteFromDisk) {
    const absolutePath = toAbsolutePath(row.get('relative_path') as string);
    if (absolutePath) {
      await fs.promises.rm(absolutePath, { force: true }).catch(() => undefined);
    }
  }
  await row.destroy();
};

export const removeFileByPath = async (absolutePath: string, deleteFromDisk = false): Promise<void> => {
  let relativePath = '';
  try {
    relativePath = toRelativePath(absolutePath);
  } catch {
    return;
  }
  if (deleteFromDisk) {
    await fs.promises.rm(path.resolve(PATH.root, relativePath), { force: true }).catch(() => undefined);
  }
  await LocalFileModel.destroy({ where: { relative_path: relativePath } });
};

export const removeFilesByPathPrefix = async (absoluteDir: string): Promise<void> => {
  let relativePrefix = '';
  try {
    relativePrefix = toRelativePath(absoluteDir);
  } catch {
    return;
  }
  await LocalFileModel.destroy({
    where: { relative_path: { [Op.like]: `${relativePrefix}/%` } },
  });
};
