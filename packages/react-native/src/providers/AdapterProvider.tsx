import {createContext, useCallback, useMemo, useState} from 'react';

export type AdapterContextType = {
  showModal: (uri: string) => void;
  hideModal: () => void;
};

export const AdapterContext = createContext<AdapterContextType | null>(null);

export type AdapterProviderProps = {
  modal: React.FC<{url: string}>;
  children?: React.ReactNode;
};

export const AdapterProvider: React.FC<AdapterProviderProps> = ({modal: Modal, children}) => {
  const [modalUrl, setModalUrl] = useState<string | null>(null);

  const showModal = useCallback((url: string) => {
    setModalUrl(url);
  }, []);

  const hideModal = useCallback(() => {
    setModalUrl(null);
  }, []);

  const context = useMemo(() => ({showModal, hideModal}), [showModal, hideModal]);

  return (
    <AdapterContext.Provider value={context}>
      {children}

      {modalUrl && <Modal url={modalUrl} />}
    </AdapterContext.Provider>
  );
};
