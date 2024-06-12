import SignClient from '@walletconnect/sign-client';
import {StarknetWindowObject} from 'get-starknet-core';

export class BaseWCWalletAdapter implements StarknetWindowObject {
  public client: SignClient;
}
