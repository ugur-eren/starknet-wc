import {useContext} from 'react';
import {ConnectorContext} from '../../providers/ConnectorProvider';

export const useConnectorContext = () => {
  const context = useContext(ConnectorContext);

  if (!context) {
    throw new Error('You must wrap your app in ConnectorProvider');
  }

  return context;
};
