import { Context } from 'koa';
interface MyContext extends Context {
  state: {
    userInfo?: {
      id: string;
    };
  };
}

// 全局类型
declare global {
  type MyMiddleware = (ctx: MyContext, next: (result?: any) => Promise<any>) => Promise<any>;

  type AsyncObject = Record<string, MyMiddleware>;

  type KeyObject<T> = Record<T, MyMiddleware>;

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
    }
  }
}

export {};
