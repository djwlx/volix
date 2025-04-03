import { ModalHookType } from '@/hooks';
import { get115QrCode, get115QrCodeStatus, Login115 } from '@/services/115';
import { CheckCircleFilled } from '@ant-design/icons';
import { Modal, QRCode, QRCodeProps, Select, Space, Spin, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';

interface LoginModalProps extends ModalHookType {
  visible: boolean;
  reload?: () => void;
}

function LoginModal(props: LoginModalProps) {
  const { visible, closeModal, reload } = props;
  const [qrValue, setQrValue] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [codeStatus, setCodeStatus] = useState<any>();
  const [modalLoading, setModalLoading] = useState(false);
  const [appValue, setAppValue] = useState('ios');

  const customStatusRender: QRCodeProps['statusRender'] = info => {
    switch (info.status) {
      case 'expired':
        return (
          <div>
            <CheckCircleFilled style={{ color: 'green' }} /> {'登陆成功'}
          </div>
        );
      case 'loading':
        return (
          <Space direction="vertical">
            <Spin />
            <p>Loading...</p>
          </Space>
        );
      case 'scanned':
        return (
          <div>
            <CheckCircleFilled style={{ color: 'green' }} /> {info.locale?.scanned}
          </div>
        );
      default:
        return null;
    }
  };

  const getQrCode = () => {
    setLoading(true);
    get115QrCode()
      .then(res => {
        setQrValue(res.data?.data);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const loginTask = async () => {
    while (true) {
      try {
        const result = await getCodeStatus();
        const data = result?.data?.data;
        if (data?.code === 0) {
          setCodeStatus(data?.data);
        }
        if (data?.data?.status === 2) {
          break;
        }
      } catch (error) {
        message.error('扫码失败');
        break; // 如果任务失败，则终止整个流程
      }
    }
  };

  const qrCodeStatus = useMemo<QRCodeProps['status']>(() => {
    if (loading) {
      return 'loading';
    }
    if (codeStatus?.status === 1) {
      return 'scanned';
    }
    if (codeStatus?.status === 2) {
      return 'expired';
    }
    return 'active';
  }, [loading, codeStatus]);

  const getCodeStatus = async () => {
    if (qrValue?.qrCodeValue) {
      const result = await get115QrCodeStatus(qrValue?.qrCodeValue);
      return result;
    }
  };

  const login115 = async () => {
    if (codeStatus?.status === 2) {
      setModalLoading(true);
      const result = await Login115({ uid: qrValue?.qrCodeValue?.uid, app: appValue });
      if (result.data?.code === 0) {
        message.success('登录成功');
        closeModal();
        reload?.();
      }
    } else {
      message.error('未进行登录');
    }
  };

  useEffect(() => {
    if (visible) {
      getQrCode();
    } else {
      setQrValue(undefined);
    }
  }, [visible]);

  useEffect(() => {
    if (qrValue) {
      loginTask();
    }
  }, [qrValue]);

  return (
    <Modal
      confirmLoading={modalLoading}
      closable={false}
      title="登录到115"
      onOk={login115}
      maskClosable={false}
      open={visible}
      onCancel={closeModal}
    >
      <Select
        style={{ width: 120 }}
        value={appValue}
        onChange={setAppValue}
        prefix="app"
        options={[
          { value: 'ios', label: 'ios' },
          { value: 'web', label: 'web' },
          { value: 'tv', label: 'tv' },
          { value: 'android', label: 'android', disabled: true },
        ]}
      />
      <QRCode
        style={{ margin: '0 auto' }}
        value={qrValue?.qrCode || '-'}
        status={qrCodeStatus}
        statusRender={customStatusRender}
      />
    </Modal>
  );
}
export default LoginModal;
