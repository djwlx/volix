import { createQbittorrentSdk } from '../../../../sdk';
import { AppConfigEnum } from '../../../config/model/config.model';
import type { AiInternalToolDefinition } from '../ai-internal-tool.types';
import { resolveConfigForExecution } from './config-tools';

const getQbitSdk = async () => {
  const config = await resolveConfigForExecution<{
    baseUrl: string;
    username: string;
    password: string;
  }>(AppConfigEnum.account_qbittorrent);

  return createQbittorrentSdk({
    apiHost: config.baseUrl,
    username: config.username,
    password: config.password,
  });
};

export const buildQbitInternalTools = (): AiInternalToolDefinition[] => {
  return [
    {
      name: 'qbit.get_torrent_list',
      description: '查看 qBittorrent 当前任务列表。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {},
      execute: async () => {
        const sdk = await getQbitSdk();
        const list = await sdk.getTorrentList();
        return {
          internalResult: list,
          modelResult: list.map(item => ({
            hash: item.hash,
            name: item.name,
            progress: item.progress,
            state: item.state,
            save_path: item.save_path,
            dlspeed: item.dlspeed,
            upspeed: item.upspeed,
          })),
        };
      },
    },
    {
      name: 'qbit.get_torrent_by_hash',
      description: '按 hash 查询 qBittorrent 单个任务。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        hash: 'string',
      },
      execute: async (_context, input) => {
        const sdk = await getQbitSdk();
        return {
          internalResult: await sdk.getTorrentByHash(String(input.hash || '')),
        };
      },
    },
    {
      name: 'qbit.get_torrents_by_tag',
      description: '按标签查询 qBittorrent 任务。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        tag: 'string',
      },
      execute: async (_context, input) => {
        const sdk = await getQbitSdk();
        return {
          internalResult: await sdk.getTorrentsByTag(String(input.tag || '')),
        };
      },
    },
    {
      name: 'qbit.delete_torrents',
      description: '删除 qBittorrent 任务。',
      category: 'sdk',
      riskLevel: 'write_high',
      requiresApproval: true,
      inputSchema: {
        hashes: 'string|string[]',
        deleteFiles: 'boolean?',
      },
      summarizeForFrontend: input => ({
        hashes: input.hashes,
        deleteFiles: Boolean(input.deleteFiles),
      }),
      execute: async (_context, input) => {
        const sdk = await getQbitSdk();
        await sdk.deleteTorrents(input.hashes as any, {
          deleteFiles: Boolean(input.deleteFiles),
        });
        return {
          internalResult: {
            ok: true,
            hashes: input.hashes,
          },
        };
      },
    },
    {
      name: 'qbit.add_torrents',
      description: '添加 qBittorrent 下载任务。',
      category: 'sdk',
      riskLevel: 'write_high',
      requiresApproval: true,
      inputSchema: {
        urls: 'string[]?',
        category: 'string?',
        tags: 'string[]?',
        paused: 'boolean?',
        skipChecking: 'boolean?',
        savepath: 'string?',
      },
      summarizeForFrontend: input => ({
        urls: input.urls,
        category: input.category,
        tags: input.tags,
        paused: Boolean(input.paused),
        skipChecking: Boolean(input.skipChecking),
        savepath: input.savepath,
      }),
      execute: async (_context, input) => {
        const sdk = await getQbitSdk();
        await sdk.addTorrents({
          urls: Array.isArray(input.urls) ? (input.urls as string[]) : undefined,
          category: input.category ? String(input.category) : undefined,
          tags: Array.isArray(input.tags) ? (input.tags as string[]) : undefined,
          paused: input.paused !== undefined ? Boolean(input.paused) : undefined,
          skipChecking: input.skipChecking !== undefined ? Boolean(input.skipChecking) : undefined,
          savepath: input.savepath ? String(input.savepath) : undefined,
        });
        return {
          internalResult: { ok: true },
        };
      },
    },
    {
      name: 'qbit.pause_torrents',
      description: '暂停 qBittorrent 任务。',
      category: 'sdk',
      riskLevel: 'write_low',
      requiresApproval: true,
      inputSchema: {
        hashes: 'string|string[]',
      },
      summarizeForFrontend: input => ({ hashes: input.hashes }),
      execute: async (_context, input) => ({
        internalResult: await (await getQbitSdk()).pauseTorrents(input.hashes as any),
      }),
    },
    {
      name: 'qbit.resume_torrents',
      description: '恢复 qBittorrent 任务。',
      category: 'sdk',
      riskLevel: 'write_low',
      requiresApproval: true,
      inputSchema: {
        hashes: 'string|string[]',
      },
      summarizeForFrontend: input => ({ hashes: input.hashes }),
      execute: async (_context, input) => ({
        internalResult: await (await getQbitSdk()).resumeTorrents(input.hashes as any),
      }),
    },
    {
      name: 'qbit.recheck_torrents',
      description: '重新校验 qBittorrent 任务。',
      category: 'sdk',
      riskLevel: 'write_low',
      requiresApproval: true,
      inputSchema: {
        hashes: 'string|string[]',
      },
      summarizeForFrontend: input => ({ hashes: input.hashes }),
      execute: async (_context, input) => ({
        internalResult: await (await getQbitSdk()).recheckTorrents(input.hashes as any),
      }),
    },
    {
      name: 'qbit.reannounce_torrents',
      description: '重新汇报 qBittorrent 任务。',
      category: 'sdk',
      riskLevel: 'write_low',
      requiresApproval: true,
      inputSchema: {
        hashes: 'string|string[]',
      },
      summarizeForFrontend: input => ({ hashes: input.hashes }),
      execute: async (_context, input) => ({
        internalResult: await (await getQbitSdk()).reannounceTorrents(input.hashes as any),
      }),
    },
  ];
};
