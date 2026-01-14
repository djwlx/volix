import { get115QrCode, get115QrCodeStatus, login115 } from '@/services/115';
import type { QrCodeResponse, QrCodeStatusParams } from '@volix/types';
import { omit } from '@volix/utils';
import { useEffect, useState } from 'react';
import { Spin, Toast } from '@douyinfe/semi-ui';

export function Login() {
  const [qrCodeValue, setQrCodeValue] = useState<QrCodeResponse>();
  const [scaned, setScaned] = useState('');

  const login = async () => {
    await login115({
      uid: qrCodeValue?.qrCodeValue.uid as string,
      app: 'ios',
    });
    window.location.reload();
  };

  const getQrStatus = async (params: QrCodeStatusParams) => {
    const res = await get115QrCodeStatus(params);
    if (res.data.status === 1) {
      setScaned(res.data.msg);
    } else {
      Toast.warning('扫码超时，请重新扫码');
      getQr();
    }
  };

  const checkIsConfirm = async (params: QrCodeStatusParams) => {
    const res = await get115QrCodeStatus(params);
    if (res.data.status === 2) {
      login();
    } else {
      Toast.warning('超时，请重新扫码');
      getQr();
    }
  };

  const getQr = async () => {
    setQrCodeValue(undefined);
    const result = await get115QrCode();
    setQrCodeValue(result.data);
  };

  useEffect(() => {
    getQr();
  }, []);

  useEffect(() => {
    if (qrCodeValue) {
      getQrStatus(omit(qrCodeValue.qrCodeValue, ['qrcode']));
    }
  }, [qrCodeValue]);

  useEffect(() => {
    if (scaned && qrCodeValue) {
      checkIsConfirm(omit(qrCodeValue.qrCodeValue, ['qrcode']));
      // login();
    }
  }, [scaned, qrCodeValue]);

  const imgStyle = {
    width: 150,
    height: 150,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  };

  return (
    <center>
      <div>扫码登录</div>
      {scaned ? (
        <div style={{ ...imgStyle, border: '1px solid black' }}>{scaned}</div>
      ) : (
        <Spin spinning={qrCodeValue === undefined}>
          <img style={imgStyle} src={qrCodeValue?.qrCodeImg}></img>
        </Spin>
      )}
    </center>
  );
}
