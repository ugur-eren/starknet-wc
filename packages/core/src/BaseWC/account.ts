import type {
  AccountInterface,
  Call,
  DeclareContractPayload,
  DeclareContractResponse,
  DeployContractResponse,
  InvokeFunctionResponse,
  ProviderInterface,
  SignerInterface,
  UniversalDetails,
} from 'starknet';
import {Account} from 'starknet';
import {IStarknetRpc} from './signer';

export class StarknetRemoteAccount extends Account implements AccountInterface {
  constructor(
    provider: ProviderInterface,
    address: string,
    signer: SignerInterface,
    private wallet: IStarknetRpc,
  ) {
    super(provider, address, signer);
  }

  public async execute(
    calls: Call | Call[],
    abis?: any,
    invocationDetails: UniversalDetails = {},
  ): Promise<InvokeFunctionResponse> {
    const callsArray = Array.isArray(calls) ? calls : [calls];

    return this.wallet.starknet_requestAddInvokeTransaction({
      accountAddress: this.address,
      executionRequest: {calls: callsArray, abis, invocationDetails},
    });
  }

  public async declare(
    _contractPayload: DeclareContractPayload,
    _transactionsDetail?: UniversalDetails | undefined,
  ): Promise<DeclareContractResponse> {
    throw new Error('Not supported');
  }

  public async deployAccount(
    _contractPayload: any,
    _transactionsDetail?: UniversalDetails | undefined,
  ): Promise<DeployContractResponse> {
    throw new Error('Not supported');
  }
}
