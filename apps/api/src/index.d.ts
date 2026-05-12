import { Context } from 'koa';
import type { UserRole } from '@volix/types';
interface MyContext extends Context {
  state: {
    userInfo?: {
      id: string | number;
      email: string;
      nickname?: string;
      avatar?: string;
      role: UserRole;
      roleKey?: string;
    };
  };
}

// 全局类型
declare global {
  type MyMiddleware = (ctx: MyContext, next: (result?: unknown) => Promise<unknown>) => Promise<unknown>;

  type AsyncObject = Record<string, MyMiddleware>;

  type KeyObject<T> = Record<T, MyMiddleware>;

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      VOLIX_API_ALLOW_INSECURE_TLS?: '1' | '0' | 'true' | 'false' | 'yes' | 'no';
    }
  }
}

export {};
