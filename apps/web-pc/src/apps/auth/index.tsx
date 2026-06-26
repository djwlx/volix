import { useEffect, useState } from 'react';
import { Button, Toast, Typography } from '@douyinfe/semi-ui';
import type { LoginUserPayload, RegisterUserPayload, ResetPasswordPayload } from '@volix/types';
import { useI18n } from '@/i18n';
import {
  getRegisterConfig,
  loginUser,
  registerUser,
  resetPassword,
  sendForgotPasswordCode,
  sendRegisterCode,
} from '@/services/user';
import { AppForm, PageCard } from '@/components';
import { setAuthToken } from '@/utils';
import { useLocation, useNavigate } from 'react-router';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import { useUserStore } from '@/stores';

type Mode = 'login' | 'register' | 'reset';

const getErrorMessage = (error: unknown, t: (key: string, values?: Record<string, unknown>) => string) => {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return message || t('common.error.requestFailed');
};

function AuthApp() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [registerEmailVerifyRequired, setRegisterEmailVerifyRequired] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [formApi, setFormApi] = useState<FormApi<Record<string, unknown>>>();
  const navigate = useNavigate();
  const location = useLocation();
  const refreshCurrentUser = useUserStore(state => state.refreshCurrentUser);
  const redirectTo = ((location.state as { from?: string } | null)?.from || '/') as string;
  const query = new URLSearchParams(location.search);
  const resetToken = query.get('token')?.trim() || '';
  const resetEmail = query.get('email')?.trim() || '';
  const resetByToken = mode === 'reset' && Boolean(resetToken);

  useEffect(() => {
    getRegisterConfig()
      .then(res => {
        setRegisterEmailVerifyRequired(Boolean(res.data?.emailVerificationRequired));
      })
      .catch(() => {
        setRegisterEmailVerifyRequired(false);
      });
  }, []);

  useEffect(() => {
    const nextMode = query.get('mode') === 'reset' ? 'reset' : 'login';
    setMode(current => (current === 'register' && nextMode === 'login' ? current : nextMode));
  }, [location.search]);

  useEffect(() => {
    if (!formApi) {
      return;
    }
    if (resetEmail) {
      formApi.setValue('email', resetEmail);
    }
  }, [formApi, resetEmail]);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }
    const timer = window.setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const onSubmit = async (values: unknown) => {
    const payload = values as LoginUserPayload & RegisterUserPayload & ResetPasswordPayload;
    try {
      setLoading(true);

      if (mode === 'register') {
        await registerUser(payload);
        Toast.success(t({ id: 'auth.register.success', defaultMessage: '注册成功，请登录' }));
        setMode('login');
        return;
      }

      if (mode === 'reset') {
        await resetPassword({
          email: payload.email,
          verifyCode: resetByToken ? undefined : payload.verifyCode,
          token: resetByToken ? resetToken : undefined,
          newPassword: payload.newPassword || payload.password,
        });
        Toast.success(t({ id: 'auth.reset.success', defaultMessage: '密码已重置，请重新登录' }));
        setMode('login');
        navigate('/auth', { replace: true });
        return;
      }

      const res = await loginUser(payload);
      const token = typeof res.data === 'string' ? res.data : res.data?.token;
      if (!token) {
        Toast.error(t({ id: 'auth.login.tokenMissing', defaultMessage: '登录失败，未获取到 token' }));
        return;
      }

      setAuthToken(token);
      await refreshCurrentUser();
      Toast.success(t({ id: 'auth.login.success', defaultMessage: '登录成功' }));
      navigate(redirectTo, { replace: true });
    } catch (error) {
      Toast.error(getErrorMessage(error, t));
    } finally {
      setLoading(false);
    }
  };

  const onSendCode = async () => {
    const email = String(formApi?.getValue('email') || '').trim();
    if (!email) {
      Toast.warning(t({ id: 'auth.register.enterEmailFirst', defaultMessage: '请先输入邮箱' }));
      return;
    }
    try {
      setSendingCode(true);
      if (mode === 'register') {
        await sendRegisterCode({ email });
        Toast.success(t({ id: 'auth.register.codeSent', defaultMessage: '验证码已发送，请检查邮箱' }));
      } else {
        await sendForgotPasswordCode({ email });
        Toast.success(t({ id: 'auth.reset.codeSent', defaultMessage: '重置邮件已发送，请检查邮箱' }));
      }
      setCountdown(60);
    } catch (error) {
      Toast.error(getErrorMessage(error, t));
    } finally {
      setSendingCode(false);
    }
  };

  const titleMap: Record<Mode, string> = {
    login: t({ id: 'auth.mode.login.title', defaultMessage: '账号登录' }),
    register: t({ id: 'auth.mode.register.title', defaultMessage: '账号注册' }),
    reset: t({ id: 'auth.mode.reset.title', defaultMessage: '重置密码' }),
  };

  const submitTextMap: Record<Mode, string> = {
    login: t({ id: 'auth.mode.login.submit', defaultMessage: '登录' }),
    register: t({ id: 'auth.mode.register.submit', defaultMessage: '注册' }),
    reset: t({ id: 'auth.mode.reset.submit', defaultMessage: '重置密码' }),
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background:
          'linear-gradient(145deg, color-mix(in srgb, var(--semi-color-info-light-default) 75%, transparent) 0%, color-mix(in srgb, var(--semi-color-success-light-default) 65%, transparent) 100%)',
        padding: 16,
      }}
    >
      <PageCard
        title={titleMap[mode]}
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 12,
          border: '1px solid var(--semi-color-border)',
        }}
      >
        <AppForm onSubmit={onSubmit} labelPosition="top" getFormApi={setFormApi}>
          <AppForm.Input
            field="email"
            label={t({ id: 'auth.email.label', defaultMessage: '邮箱' })}
            placeholder={t({ id: 'auth.email.placeholder', defaultMessage: '请输入邮箱' })}
            rules={[
              { required: true, message: t({ id: 'auth.email.required', defaultMessage: '请输入邮箱' }) },
              { type: 'email', message: t({ id: 'auth.email.invalid', defaultMessage: '邮箱格式错误' }) },
            ]}
          />
          {mode === 'reset' ? (
            <>
              <AppForm.Input
                field="newPassword"
                mode="password"
                label={t({ id: 'auth.reset.password.label', defaultMessage: '新密码' })}
                placeholder={t({ id: 'auth.reset.password.placeholder', defaultMessage: '请输入新密码' })}
                rules={[
                  {
                    required: true,
                    message: t({ id: 'auth.reset.password.required', defaultMessage: '请输入新密码' }),
                  },
                  { min: 6, message: t({ id: 'auth.password.min', defaultMessage: '密码至少 6 位' }) },
                ]}
              />
              {!resetByToken ? (
                <>
                  <AppForm.Input
                    field="verifyCode"
                    label={t({ id: 'auth.verifyCode.label', defaultMessage: '邮箱验证码' })}
                    placeholder={t({ id: 'auth.verifyCode.placeholder', defaultMessage: '请输入邮箱验证码' })}
                    rules={[
                      {
                        required: true,
                        message: t({ id: 'auth.verifyCode.required', defaultMessage: '请输入邮箱验证码' }),
                      },
                    ]}
                  />
                  <Button
                    onClick={onSendCode}
                    loading={sendingCode}
                    disabled={countdown > 0}
                    style={{ width: '100%', marginBottom: 12 }}
                  >
                    {countdown > 0
                      ? t(
                          { id: 'auth.verifyCode.resendCountdown', defaultMessage: '{countdown}s 后重发' },
                          { countdown }
                        )
                      : t({ id: 'auth.reset.send', defaultMessage: '发送重置邮件' })}
                  </Button>
                </>
              ) : null}
            </>
          ) : (
            <AppForm.Input
              field="password"
              mode="password"
              label={t({ id: 'auth.password.label', defaultMessage: '密码' })}
              placeholder={t({ id: 'auth.password.placeholder', defaultMessage: '请输入密码' })}
              rules={[
                { required: true, message: t({ id: 'auth.password.required', defaultMessage: '请输入密码' }) },
                { min: 6, message: t({ id: 'auth.password.min', defaultMessage: '密码至少 6 位' }) },
              ]}
            />
          )}
          {mode === 'register' && registerEmailVerifyRequired ? (
            <>
              <AppForm.Input
                field="verifyCode"
                label={t({ id: 'auth.verifyCode.label', defaultMessage: '邮箱验证码' })}
                placeholder={t({ id: 'auth.verifyCode.placeholder', defaultMessage: '请输入邮箱验证码' })}
                rules={[
                  {
                    required: true,
                    message: t({ id: 'auth.verifyCode.required', defaultMessage: '请输入邮箱验证码' }),
                  },
                ]}
              />
              <Button
                onClick={onSendCode}
                loading={sendingCode}
                disabled={countdown > 0}
                style={{ width: '100%', marginBottom: 12 }}
              >
                {countdown > 0
                  ? t({ id: 'auth.verifyCode.resendCountdown', defaultMessage: '{countdown}s 后重发' }, { countdown })
                  : t({ id: 'auth.verifyCode.send', defaultMessage: '发送验证码' })}
              </Button>
            </>
          ) : null}

          <Button htmlType="submit" theme="solid" type="primary" loading={loading} style={{ width: '100%' }}>
            {submitTextMap[mode]}
          </Button>
        </AppForm>
        {mode === 'login' ? (
          <>
            <Typography.Text
              link
              onClick={() => setMode('register')}
              style={{ marginTop: 12, display: 'inline-block', marginRight: 12 }}
            >
              {t({ id: 'auth.mode.login.switch', defaultMessage: '没有账号？去注册' })}
            </Typography.Text>
            <Typography.Text link onClick={() => setMode('reset')} style={{ marginTop: 12, display: 'inline-block' }}>
              {t({ id: 'auth.mode.login.forgot', defaultMessage: '忘记密码？' })}
            </Typography.Text>
          </>
        ) : (
          <Typography.Text link onClick={() => setMode('login')} style={{ marginTop: 12, display: 'inline-block' }}>
            {mode === 'register'
              ? t({ id: 'auth.mode.register.switch', defaultMessage: '已有账号？去登录' })
              : t({ id: 'auth.mode.reset.switch', defaultMessage: '返回登录' })}
          </Typography.Text>
        )}
      </PageCard>
    </div>
  );
}

export default AuthApp;
