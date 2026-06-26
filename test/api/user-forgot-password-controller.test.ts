import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../../apps/api/src/modules/shared/http-handler';

const mocked = vi.hoisted(() => ({
  queryUser: vi.fn(),
  updateUser: vi.fn(),
  getSystemRegisterSmtpConfig: vi.fn(),
  assertResetPasswordCodeCanSend: vi.fn(),
  generateRegisterVerifyCode: vi.fn(),
  generateResetPasswordToken: vi.fn(),
  saveResetPasswordVerifyCode: vi.fn(),
  saveResetPasswordToken: vi.fn(),
  sendResetPasswordMail: vi.fn(),
  verifyResetPasswordCode: vi.fn(),
  consumeResetPasswordToken: vi.fn(),
  hashPassword: vi.fn(),
}));

vi.mock('../../apps/api/src/modules/user/service/user.service', () => ({
  queryUser: mocked.queryUser,
  updateUser: mocked.updateUser,
  addUser: vi.fn(),
  countUsers: vi.fn(),
}));

vi.mock('../../apps/api/src/modules/user/service/system-setting.service', () => ({
  getSystemConfigData: vi.fn(),
  getSystemRegisterSmtpConfig: mocked.getSystemRegisterSmtpConfig,
}));

vi.mock('../../apps/api/src/modules/user/service/email.service', () => ({
  assertRegisterCodeCanSend: vi.fn(),
  generateRegisterVerifyCode: mocked.generateRegisterVerifyCode,
  saveRegisterVerifyCode: vi.fn(),
  sendRegisterCodeMail: vi.fn(),
  verifyRegisterCode: vi.fn(),
  assertResetPasswordCodeCanSend: mocked.assertResetPasswordCodeCanSend,
  generateResetPasswordToken: mocked.generateResetPasswordToken,
  saveResetPasswordVerifyCode: mocked.saveResetPasswordVerifyCode,
  saveResetPasswordToken: mocked.saveResetPasswordToken,
  sendResetPasswordMail: mocked.sendResetPasswordMail,
  verifyResetPasswordCode: mocked.verifyResetPasswordCode,
  consumeResetPasswordToken: mocked.consumeResetPasswordToken,
}));

vi.mock('../../apps/api/src/utils/password', () => ({
  hashPassword: mocked.hashPassword,
  isHashedPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

describe('user forgot password controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.queryUser.mockResolvedValue({
      dataValues: {
        id: 9,
        email: 'user@example.com',
      },
    });
    mocked.getSystemRegisterSmtpConfig.mockResolvedValue({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      username: 'mailer',
      password: 'secret',
      fromEmail: 'noreply@example.com',
    });
    mocked.generateRegisterVerifyCode.mockReturnValue('123456');
    mocked.generateResetPasswordToken.mockReturnValue('reset-token');
    mocked.hashPassword.mockResolvedValue('hashed-password');
    mocked.verifyResetPasswordCode.mockReturnValue(true);
    mocked.consumeResetPasswordToken.mockReturnValue('user@example.com');
  });

  it('sends reset email with code and direct link', async () => {
    const { sendForgotPasswordCode } = await import('../../apps/api/src/modules/user/controller/auth.controller');

    await expect(
      sendForgotPasswordCode({
        origin: 'https://volix.example.com',
        request: {
          body: {
            email: 'user@example.com',
          },
        },
      } as never)
    ).resolves.toEqual({
      success: true,
    });

    expect(mocked.assertResetPasswordCodeCanSend).toHaveBeenCalledWith('user@example.com');
    expect(mocked.saveResetPasswordVerifyCode).toHaveBeenCalledWith('user@example.com', '123456');
    expect(mocked.saveResetPasswordToken).toHaveBeenCalledWith('user@example.com', 'reset-token');
    expect(mocked.sendResetPasswordMail).toHaveBeenCalledWith(
      expect.objectContaining({
        toEmail: 'user@example.com',
        code: '123456',
        resetLink: 'https://volix.example.com/auth?mode=reset&token=reset-token&email=user%40example.com',
      })
    );
  });

  it('resets password with verify code', async () => {
    const { resetPassword } = await import('../../apps/api/src/modules/user/controller/auth.controller');

    await expect(
      resetPassword({
        request: {
          body: {
            email: 'user@example.com',
            verifyCode: '123456',
            newPassword: 'new-password',
          },
        },
      } as never)
    ).resolves.toEqual({
      success: true,
    });

    expect(mocked.verifyResetPasswordCode).toHaveBeenCalledWith('user@example.com', '123456');
    expect(mocked.hashPassword).toHaveBeenCalledWith('new-password');
    expect(mocked.updateUser).toHaveBeenCalledWith(9, { password: 'hashed-password' });
  });

  it('resets password with token', async () => {
    const { resetPassword } = await import('../../apps/api/src/modules/user/controller/auth.controller');

    await expect(
      resetPassword({
        request: {
          body: {
            token: 'reset-token',
            newPassword: 'new-password',
          },
        },
      } as never)
    ).resolves.toEqual({
      success: true,
    });

    expect(mocked.consumeResetPasswordToken).toHaveBeenCalledWith('reset-token');
    expect(mocked.updateUser).toHaveBeenCalledWith(9, { password: 'hashed-password' });
  });

  it('rejects invalid reset token', async () => {
    mocked.consumeResetPasswordToken.mockReturnValueOnce(null);
    const { resetPassword } = await import('../../apps/api/src/modules/user/controller/auth.controller');

    await expect(
      resetPassword({
        request: {
          body: {
            token: 'bad-token',
            newPassword: 'new-password',
          },
        },
      } as never)
    ).rejects.toMatchObject({
      status: 400,
    } satisfies Partial<HttpError>);
  });
});
