import {useContext} from 'react';
import {AdapterContext} from '../../providers/AdapterProvider';

export const useAdapterContext = () => {
  const context = useContext(AdapterContext);

  if (!context) {
    throw new Error('You must wrap your app in AdapterProvider');
  }

  return context;
};
