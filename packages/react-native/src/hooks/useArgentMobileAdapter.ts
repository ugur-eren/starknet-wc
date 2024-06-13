import {useCallback} from 'react';
import {BaseWCConnectorConstructorOptions} from 'core';
import {useAdapterContext} from './internal/useAdapterContext';
import {ArgentMobileConnector} from '../adapters/ArgentMobile';

export const useArgentMobileAdapter = () => {
  const {showModal} = useAdapterContext();

  const handleConnection = useCallback(
    async (uri: string) => {
      showModal(uri);
    },
    [showModal],
  );

  const argentMobileAdapter = useCallback(
    (options: BaseWCConnectorConstructorOptions) => {
      return new ArgentMobileConnector(options, handleConnection);
    },
    [handleConnection],
  );

  return argentMobileAdapter;
};
