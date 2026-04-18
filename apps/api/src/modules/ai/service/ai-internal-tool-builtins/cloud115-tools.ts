import { create115Sdk } from '../../../../sdk/115';
import { AppConfigEnum } from '../../../config/model/config.model';
import type { AiInternalToolDefinition } from '../ai-internal-tool.types';
import { resolveConfigForExecution } from './config-tools';

const get115Sdk = async () => {
  const cookie = await resolveConfigForExecution<string>(AppConfigEnum.cookie_115);
  return create115Sdk({
    cookie: typeof cookie === 'string' ? cookie : undefined,
  });
};

export const buildCloud115InternalTools = (): AiInternalToolDefinition[] => {
  return [
    {
      name: 'cloud115.get_qr_code',
      description: '获取 115 登录二维码。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {},
      execute: async () => ({
        internalResult: await create115Sdk().getQrCode(),
      }),
    },
    {
      name: 'cloud115.get_qr_status',
      description: '获取 115 二维码扫码状态。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        uid: 'string',
        time: 'number',
        sign: 'string',
      },
      execute: async (_context, input) => ({
        internalResult: await create115Sdk().getQrStatus({
          uid: String(input.uid || ''),
          time: Number(input.time || 0),
          sign: String(input.sign || ''),
        } as any),
      }),
    },
    {
      name: 'cloud115.check_login',
      description: '检查当前 115 Cookie 是否有效。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {},
      execute: async () => ({
        internalResult: await (await get115Sdk()).checkLogin(),
      }),
    },
    {
      name: 'cloud115.get_user_info',
      description: '读取当前 115 用户信息。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {},
      execute: async () => ({
        internalResult: await (await get115Sdk()).getUserInfo(),
      }),
    },
    {
      name: 'cloud115.get_file_list',
      description: '列出 115 文件列表。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        offset: 'number?',
        pageSize: 'number?',
        cid: 'string?',
      },
      execute: async (_context, input) => ({
        internalResult: await (
          await get115Sdk()
        ).getFileList(
          input.offset ? Number(input.offset) : undefined,
          input.pageSize ? Number(input.pageSize) : undefined,
          input.cid ? String(input.cid) : undefined
        ),
      }),
    },
    {
      name: 'cloud115.get_file',
      description: '通过 pickcode 获取 115 文件下载信息。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        pc: 'string',
        ua: 'string',
      },
      execute: async (_context, input) => ({
        internalResult: await (await get115Sdk()).getFile(String(input.pc || ''), String(input.ua || '')),
      }),
    },
    {
      name: 'cloud115.login_with_app',
      description: '通过二维码 UID 和 app 类型登录 115，并返回 Cookie。',
      category: 'sdk',
      riskLevel: 'write_high',
      requiresApproval: true,
      inputSchema: {
        uid: 'string',
        app: 'string',
      },
      summarizeForFrontend: input => ({
        uid: String(input.uid || ''),
        app: String(input.app || ''),
      }),
      execute: async (_context, input) => ({
        internalResult: await create115Sdk().loginWithApp(String(input.uid || ''), String(input.app || 'ios') as any),
      }),
    },
  ];
};
