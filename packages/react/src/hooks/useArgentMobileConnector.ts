import {useCallback} from 'react';
import {BaseWCConnectorConstructorOptions} from '@starknet-wc/core';
import {useConnectorContext} from './internal/useConnectorContext';
import {ArgentMobileConnector} from '../connectors/ArgentMobile';

export const useArgentMobileConnector = () => {
  const {showModal, hideModal} = useConnectorContext();

  const handleConnection = useCallback(
    async (uri: string) => {
      showModal(uri);

      return () => {
        hideModal();
      };
    },
    [showModal, hideModal],
  );

  const argentMobileConnector = useCallback(
    (options: BaseWCConnectorConstructorOptions) => {
      return new ArgentMobileConnector(options, handleConnection);
    },
    [handleConnection],
  );

  return argentMobileConnector;
};
