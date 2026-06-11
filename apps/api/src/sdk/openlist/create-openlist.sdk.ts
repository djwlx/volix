import { createOpenlistAdminModule } from './admin/openlist-admin';
import { createOpenlistAuthModule } from './auth/openlist-auth';
import { createOpenlistFsModule } from './fs/openlist-fs';
import { createOpenlistPublicModule } from './public/openlist-public';
import { createRequestOpenlist, hashOpenlistPassword } from './core/request-openlist';
import type { CreateOpenlistSdkOptions, OpenlistFsListData } from './core/openlist.types';
import { createOpenlistShareModule } from './share/openlist-share';
import { createOpenlistUserModule } from './user/openlist-user';

export { hashOpenlistPassword };
export type { CreateOpenlistSdkOptions, OpenlistFsListData };

export function createOpenlistSdk(options: CreateOpenlistSdkOptions) {
  const session = createRequestOpenlist(options);

  return {
    getToken: session.getToken,
    setToken: session.setToken,
    clearToken: session.clearToken,
    requestOpenlist: session.requestOpenlist,
    ...createOpenlistAuthModule(session.requestOpenlist, session.setToken, session.clearToken),
    ...createOpenlistUserModule(session.requestOpenlist),
    ...createOpenlistAdminModule(session.requestOpenlist),
    ...createOpenlistFsModule(session.requestOpenlist),
    ...createOpenlistPublicModule(session.requestOpenlist),
    ...createOpenlistShareModule(session.requestOpenlist),
  };
}

export type OpenlistSdk = ReturnType<typeof createOpenlistSdk>;
