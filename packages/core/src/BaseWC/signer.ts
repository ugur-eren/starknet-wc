import type {
  Abi,
  Call,
  InvocationsDetails,
  InvokeFunctionResponse,
  Signature,
  TypedData,
  DeclareSignerDetails,
  DeployAccountSignerDetails,
  Invocation,
  InvocationsSignerDetails,
  SignerInterface,
} from 'starknet';

// see https://github.com/WalletConnect/walletconnect-docs/pull/288/files
export interface IStarknetRpc {
  starknet_signTypedData(params: {
    accountAddress: string;
    typedData: TypedData;
  }): Promise<{signature: Signature}>;
  starknet_requestAddInvokeTransaction(params: {
    accountAddress: string;
    executionRequest: {
      calls: Call[];
      abis?: Abi[];
      invocationDetails?: InvocationsDetails;
    };
  }): Promise<InvokeFunctionResponse>;
}

export class StarknetRemoteSigner implements SignerInterface {
  // eslint-disable-next-line no-useless-constructor
  constructor(private wallet: IStarknetRpc) {}

  public async getPubKey(): Promise<string> {
    throw new Error('Not supported via Argent Login');
  }

  public async signMessage(typedData: TypedData, accountAddress: string): Promise<Signature> {
    const {signature} = await this.wallet.starknet_signTypedData({
      accountAddress,
      typedData,
    });
    return signature;
  }

  public async signTransaction(
    _transactions: Invocation[],
    _transactionsDetail: InvocationsSignerDetails,
    _abis?: Abi[],
  ): Promise<Signature> {
    throw new Error('Not supported via Argent Login');
  }

  public async signDeployAccountTransaction(
    _transaction: DeployAccountSignerDetails,
  ): Promise<Signature> {
    throw new Error('Not supported via Argent Login');
  }

  public async signDeclareTransaction(_transaction: DeclareSignerDetails): Promise<Signature> {
    throw new Error('Not supported via Argent Login');
  }
}
