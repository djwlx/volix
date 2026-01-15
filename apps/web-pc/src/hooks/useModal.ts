import { useState } from 'react';

type ModalModeType = 'close' | 'open';

export type ModalHookType<T = unknown> = {
  visible: boolean;
  mode: ModalHookType;
  data?: T;
  closeModal: () => void;
  setModal: (thisMode: ModalModeType, thisData?: T) => void;
};

export function useModal<T>() {
  const [mode, setMode] = useState<ModalModeType>('close');
  const [data, setData] = useState<T>();

  const setModal = (thisMode: ModalModeType, thisData?: T) => {
    if (['open'].includes(thisMode)) {
      if (thisData) {
        setData(thisData);
      }
    }
    setMode(thisMode);
  };

  const closeModal = () => {
    setMode('close');
    setData(undefined);
  };

  return {
    mode,
    visible: mode !== 'close',
    closeModal,
    setModal,
    data,
  };
}
