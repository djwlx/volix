import { useCallback, useState } from 'react';

export type ModalModeType = 'close' | 'open';

export type ModalHookType<T = any> = {
  mode: ModalModeType;
  visible: boolean;
  data?: T;
  closeModal: () => void;
  setModalData?: (mode: ModalModeType, data?: T) => void;
};

export function useModalHook<T>() {
  const [mode, setMode] = useState<ModalModeType>('close');
  const [data, setData] = useState<T>();

  const closeModal = useCallback(() => {
    setMode('close');
    setData(undefined);
  }, []);

  const setModalData = useCallback((thisMode: ModalModeType, thisData?: T) => {
    if (['open'].includes(thisMode)) {
      if (thisData) {
        setData(thisData);
      }
    }
    setMode(thisMode);
  }, []);

  return {
    mode,
    visible: mode !== 'close',
    data,
    setModalData,
    closeModal,
  };
}
