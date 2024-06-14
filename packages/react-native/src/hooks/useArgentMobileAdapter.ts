import {useCallback} from 'react';
import {BaseWCConnectorConstructorOptions} from '@starknet-wc/core';
import {useAdapterContext} from './internal/useAdapterContext';
import {ArgentMobileConnector} from '../adapters/ArgentMobile';

export const useArgentMobileAdapter = () => {
  const {showModal, hideModal} = useAdapterContext();

  const handleConnection = useCallback(
    async (uri: string) => {
      showModal(uri);

      return () => {
        hideModal();
      };
    },
    [showModal, hideModal],
  );

  const argentMobileAdapter = useCallback(
    (options: BaseWCConnectorConstructorOptions) => {
      return new ArgentMobileConnector(options, handleConnection);
    },
    [handleConnection],
  );

  return argentMobileAdapter;
};