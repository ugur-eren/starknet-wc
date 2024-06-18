import {createContext, useCallback, useMemo, useState} from 'react';

export type ConnectorContextType = {
  showModal: (uri: string) => void;
  hideModal: () => void;
};

export const ConnectorContext = createContext<ConnectorContextType | null>(null);

export type ConnectorProviderProps = {
  modal: React.FC<{url: string; hideModal: () => void}>;
  children?: React.ReactNode;
};

export const ConnectorProvider: React.FC<ConnectorProviderProps> = ({modal: Modal, children}) => {
  const [modalUrl, setModalUrl] = useState<string | null>(null);

  const showModal = useCallback((url: string) => {
    setModalUrl(url);
  }, []);

  const hideModal = useCallback(() => {
    setModalUrl(null);
  }, []);

  const context = useMemo(() => ({showModal, hideModal}), [showModal, hideModal]);

  return (
    <ConnectorContext.Provider value={context}>
      {children}

      {modalUrl && <Modal url={modalUrl} hideModal={hideModal} />}
    </ConnectorContext.Provider>
  );
};
