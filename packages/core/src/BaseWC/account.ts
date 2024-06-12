import type {
  Abi,
  AccountInterface,
  Call,
  DeclareContractPayload,
  DeclareContractResponse,
  DeployContractResponse,
  InvocationsDetails,
  InvokeFunctionResponse,
  ProviderInterface,
  SignerInterface,
} from 'starknet';
import {Account} from 'starknet';
import {IStarknetRpc} from './signer';

export class StarknetRemoteAccount extends Account implements AccountInterface {
  private wallet: IStarknetRpc;

  constructor(
    provider: ProviderInterface,
    address: string,
    signer: SignerInterface,
    wallet: IStarknetRpc,
  ) {
    super(provider, address, signer);

    this.wallet = wallet;
  }

  public async execute(
    calls: Call | Call[],
    abis: Abi[] | undefined = undefined,
    invocationDetails: InvocationsDetails = {},
  ): Promise<InvokeFunctionResponse> {
    const callsArray = Array.isArray(calls) ? calls : [calls];

    return this.wallet.starknet_requestAddInvokeTransaction({
      accountAddress: this.address,
      executionRequest: {calls: callsArray, abis, invocationDetails},
    });
  }

  public async declare(
    _contractPayload: DeclareContractPayload,
    _transactionsDetail?: InvocationsDetails | undefined,
  ): Promise<DeclareContractResponse> {
    throw new Error('Not supported');
  }

  public async deployAccount(
    _contractPayload: any,
    _transactionsDetail?: InvocationsDetails | undefined,
  ): Promise<DeployContractResponse> {
    throw new Error('Not supported');
  }
}
