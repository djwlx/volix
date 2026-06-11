import { hashOpenlistPassword, type RequestOpenlist } from '../core/request-openlist';
import type {
  OpenlistLdapLoginParams,
  OpenlistLoginParams,
  OpenlistTokenData,
  OpenlistTwoFactorSecret,
  OpenlistVerifyTwoFactorParams,
  OpenlistWebauthnCredential,
} from '../core/openlist.types';

export const createOpenlistAuthModule = (
  requestOpenlist: RequestOpenlist,
  setToken: (nextToken?: string) => void,
  clearToken: () => void
) => ({
  login: async (params: OpenlistLoginParams) => {
    const data = await requestOpenlist<OpenlistTokenData>(
      {
        url: '/api/auth/login',
        method: 'POST',
        data: {
          username: params.username,
          password: params.password,
          ...(params.otpCode ? { otp_code: params.otpCode } : {}),
        },
      },
      false
    );
    setToken(data.token);
    return data;
  },
  loginWithHashedPassword: async (username: string, plainPassword: string) => {
    const data = await requestOpenlist<OpenlistTokenData>(
      {
        url: '/api/auth/login/hash',
        method: 'POST',
        data: {
          username,
          password: hashOpenlistPassword(plainPassword),
        },
      },
      false
    );
    setToken(data.token);
    return data;
  },
  loginWithLdap: async (params: OpenlistLdapLoginParams) => {
    const data = await requestOpenlist<OpenlistTokenData>(
      {
        url: '/api/auth/login/ldap',
        method: 'POST',
        data: {
          username: params.username,
          password: params.password,
          ...(params.otpCode ? { otp_code: params.otpCode } : {}),
        },
      },
      false
    );
    setToken(data.token);
    return data;
  },
  logout: async () => {
    await requestOpenlist<null>({
      url: '/api/auth/logout',
      method: 'GET',
    });
    clearToken();
    return true;
  },
  generateTwoFactorSecret: () =>
    requestOpenlist<OpenlistTwoFactorSecret>({
      url: '/api/auth/2fa/generate',
      method: 'POST',
    }),
  verifyTwoFactor: (params: OpenlistVerifyTwoFactorParams) =>
    requestOpenlist<null>({
      url: '/api/auth/2fa/verify',
      method: 'POST',
      data: {
        code: params.code,
      },
    }),
  getSsoLoginRedirect: () =>
    requestOpenlist<Record<string, unknown>>(
      {
        url: '/api/auth/sso',
        method: 'GET',
      },
      false
    ),
  getSsoCallbackResult: (params?: Record<string, string>) =>
    requestOpenlist<Record<string, unknown>>(
      {
        url: '/api/auth/sso_callback',
        method: 'GET',
        params,
      },
      false
    ),
  beginWebauthnLogin: () =>
    requestOpenlist<Record<string, unknown>>(
      {
        url: '/api/authn/webauthn_begin_login',
        method: 'GET',
      },
      false
    ),
  finishWebauthnLogin: (payload: Record<string, unknown>) =>
    requestOpenlist<OpenlistTokenData>(
      {
        url: '/api/authn/webauthn_finish_login',
        method: 'POST',
        data: payload,
      },
      false
    ),
  beginWebauthnRegistration: () =>
    requestOpenlist<Record<string, unknown>>({
      url: '/api/authn/webauthn_begin_registration',
      method: 'GET',
    }),
  finishWebauthnRegistration: (payload: Record<string, unknown>) =>
    requestOpenlist<OpenlistWebauthnCredential>({
      url: '/api/authn/webauthn_finish_registration',
      method: 'POST',
      data: payload,
    }),
  deleteWebauthnCredential: (payload: Record<string, unknown>) =>
    requestOpenlist<null>({
      url: '/api/authn/delete_authn',
      method: 'POST',
      data: payload,
    }),
  getWebauthnCredentials: () =>
    requestOpenlist<OpenlistWebauthnCredential[]>({
      url: '/api/authn/getcredentials',
      method: 'GET',
    }),
});
