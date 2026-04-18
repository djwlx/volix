import { createOpenlistSdk } from '../../../../sdk';
import { AppConfigEnum } from '../../../config/model/config.model';
import type { AiInternalToolDefinition } from '../ai-internal-tool.types';
import { resolveConfigForExecution } from './config-tools';

const getOpenlistSdk = async (userAgent?: string) => {
  const config = await resolveConfigForExecution<{
    baseUrl: string;
    username: string;
    password: string;
  }>(AppConfigEnum.account_openlist);

  const sdk = createOpenlistSdk({
    apiHost: config.baseUrl,
    userAgent,
  });
  await sdk.loginWithHashedPassword(config.username, config.password);
  return sdk;
};

export const buildOpenlistSdkInternalTools = (): AiInternalToolDefinition[] => {
  return [
    {
      name: 'openlist_sdk.get_me',
      description: '读取 OpenList 当前账号信息。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {},
      execute: async context => ({
        internalResult: await (await getOpenlistSdk(context.requestUserAgent)).getMe(),
      }),
    },
    {
      name: 'openlist_sdk.list_fs',
      description: '列出 OpenList 指定目录。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        path: 'string',
        password: 'string?',
        page: 'number?',
        perPage: 'number?',
        refresh: 'boolean?',
      },
      execute: async (context, input) => ({
        internalResult: await (
          await getOpenlistSdk(context.requestUserAgent)
        ).listFs({
          path: String(input.path || ''),
          password: input.password ? String(input.password) : undefined,
          page: input.page ? Number(input.page) : undefined,
          perPage: input.perPage ? Number(input.perPage) : undefined,
          refresh: input.refresh !== undefined ? Boolean(input.refresh) : undefined,
        }),
      }),
    },
    {
      name: 'openlist_sdk.get_fs',
      description: '读取 OpenList 单个文件或目录详情。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        path: 'string',
        password: 'string?',
      },
      execute: async (context, input) => ({
        internalResult: await (
          await getOpenlistSdk(context.requestUserAgent)
        ).getFs({
          path: String(input.path || ''),
          password: input.password ? String(input.password) : undefined,
        }),
      }),
    },
    {
      name: 'openlist_sdk.list_storages',
      description: '列出 OpenList 存储列表。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        page: 'number?',
        perPage: 'number?',
      },
      execute: async (context, input) => ({
        internalResult: await (
          await getOpenlistSdk(context.requestUserAgent)
        ).listStorages({
          page: input.page ? Number(input.page) : undefined,
          perPage: input.perPage ? Number(input.perPage) : undefined,
        }),
      }),
    },
    {
      name: 'openlist_sdk.list_shares',
      description: '列出 OpenList 分享列表。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        page: 'number?',
        perPage: 'number?',
      },
      execute: async (context, input) => ({
        internalResult: await (
          await getOpenlistSdk(context.requestUserAgent)
        ).listShares({
          page: input.page ? Number(input.page) : undefined,
          perPage: input.perPage ? Number(input.perPage) : undefined,
        }),
      }),
    },
    {
      name: 'openlist_sdk.get_public_settings',
      description: '读取 OpenList 公开设置。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {},
      execute: async context => ({
        internalResult: await (await getOpenlistSdk(context.requestUserAgent)).getPublicSettings(),
      }),
    },
    {
      name: 'openlist_sdk.mkdir',
      description: '创建 OpenList 目录。',
      category: 'sdk',
      riskLevel: 'write_high',
      requiresApproval: true,
      inputSchema: {
        path: 'string',
      },
      summarizeForFrontend: input => ({ path: String(input.path || '') }),
      execute: async (context, input) => ({
        internalResult: await (
          await getOpenlistSdk(context.requestUserAgent)
        ).mkdir({
          path: String(input.path || ''),
        }),
      }),
    },
    {
      name: 'openlist_sdk.rename',
      description: '重命名 OpenList 文件或目录。',
      category: 'sdk',
      riskLevel: 'write_high',
      requiresApproval: true,
      inputSchema: {
        path: 'string',
        name: 'string',
      },
      summarizeForFrontend: input => ({
        path: String(input.path || ''),
        name: String(input.name || ''),
      }),
      execute: async (context, input) => ({
        internalResult: await (
          await getOpenlistSdk(context.requestUserAgent)
        ).rename({
          path: String(input.path || ''),
          name: String(input.name || ''),
        }),
      }),
    },
    {
      name: 'openlist_sdk.move',
      description: '移动 OpenList 文件或目录。',
      category: 'sdk',
      riskLevel: 'write_high',
      requiresApproval: true,
      inputSchema: {
        srcDir: 'string',
        dstDir: 'string',
        names: 'string[]',
      },
      summarizeForFrontend: input => ({
        srcDir: String(input.srcDir || ''),
        dstDir: String(input.dstDir || ''),
        names: input.names,
      }),
      execute: async (context, input) => ({
        internalResult: await (
          await getOpenlistSdk(context.requestUserAgent)
        ).move({
          srcDir: String(input.srcDir || ''),
          dstDir: String(input.dstDir || ''),
          names: Array.isArray(input.names) ? (input.names as string[]) : [],
        }),
      }),
    },
    {
      name: 'openlist_sdk.copy',
      description: '复制 OpenList 文件或目录。',
      category: 'sdk',
      riskLevel: 'write_high',
      requiresApproval: true,
      inputSchema: {
        srcDir: 'string',
        dstDir: 'string',
        names: 'string[]',
      },
      summarizeForFrontend: input => ({
        srcDir: String(input.srcDir || ''),
        dstDir: String(input.dstDir || ''),
        names: input.names,
      }),
      execute: async (context, input) => ({
        internalResult: await (
          await getOpenlistSdk(context.requestUserAgent)
        ).copy({
          srcDir: String(input.srcDir || ''),
          dstDir: String(input.dstDir || ''),
          names: Array.isArray(input.names) ? (input.names as string[]) : [],
        }),
      }),
    },
    {
      name: 'openlist_sdk.remove',
      description: '删除 OpenList 文件或目录。',
      category: 'sdk',
      riskLevel: 'write_high',
      requiresApproval: true,
      inputSchema: {
        dir: 'string',
        names: 'string[]',
      },
      summarizeForFrontend: input => ({
        dir: String(input.dir || ''),
        names: input.names,
      }),
      execute: async (context, input) => ({
        internalResult: await (
          await getOpenlistSdk(context.requestUserAgent)
        ).remove({
          dir: String(input.dir || ''),
          names: Array.isArray(input.names) ? (input.names as string[]) : [],
        }),
      }),
    },
  ];
};
