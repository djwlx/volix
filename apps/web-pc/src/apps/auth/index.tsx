import { useMemo, useState } from 'react';
import { Button, Card, Toast, Typography } from '@douyinfe/semi-ui';
import type { LoginUserPayload } from '@volix/types';
import { loginUser, registerUser } from '@/services/user';
import { AppForm } from '@/components';
import { setAuthToken } from '@/utils';
import { useLocation, useNavigate } from 'react-router';

type Mode = 'login' | 'register';

const modeTextMap: Record<Mode, { title: string; submitText: string; switchText: string }> = {
  login: {
    title: '账号登录',
    submitText: '登录',
    switchText: '没有账号？去注册',
  },
  register: {
    title: '账号注册',
    submitText: '注册',
    switchText: '已有账号？去登录',
  },
};

const getErrorMessage = (error: unknown) => {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return message || '请求失败，请稍后重试';
};

function AuthApp() {
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const modeText = useMemo(() => modeTextMap[mode], [mode]);
  const redirectTo = ((location.state as { from?: string } | null)?.from || '/') as string;

  const onSubmit = async (values: unknown) => {
    const payload = values as LoginUserPayload;
    try {
      setLoading(true);

      if (mode === 'register') {
        await registerUser(payload);
        Toast.success('注册成功，请登录');
        setMode('login');
        return;
      }

      const res = await loginUser(payload);
      const token = typeof res.data === 'string' ? res.data : res.data?.token;
      if (!token) {
        Toast.error('登录失败，未获取到 token');
        return;
      }

      setAuthToken(token);
      Toast.success('登录成功');
      navigate(redirectTo, { replace: true });
    } catch (error) {
      Toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(145deg, #e8f7ff 0%, #f8fff1 100%)',
        padding: 16,
      }}
    >
      <Card
        title={modeText.title}
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 12,
        }}
      >
        <AppForm onSubmit={onSubmit} labelPosition="top">
          <AppForm.Input
            field="email"
            label="邮箱"
            placeholder="请输入邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '邮箱格式错误' },
            ]}
          />
          <AppForm.Input
            field="password"
            mode="password"
            label="密码"
            placeholder="请输入密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          />

          <Button htmlType="submit" theme="solid" type="primary" loading={loading} style={{ width: '100%' }}>
            {modeText.submitText}
          </Button>
        </AppForm>
        <Typography.Text
          link
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          style={{ marginTop: 12, display: 'inline-block' }}
        >
          {modeText.switchText}
        </Typography.Text>
      </Card>
    </div>
  );
}

export default AuthApp;
