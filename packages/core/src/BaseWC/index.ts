import SignClient from '@walletconnect/sign-client';
import type {SessionTypes} from '@walletconnect/types';
import {
  AccountInterface,
  ProviderInterface,
  RpcProvider,
  SignerInterface,
  constants,
} from 'starknet';
import {Connector} from '../Base';
import {ConnectorNotConnectedError} from '../Base/errors';
import {IStarknetRpc, StarknetRemoteSigner} from './signer';
import {StarknetRemoteAccount} from './account';

export type BaseWCConnectorConstructorOptions = {
  wcProjectId: string;
  chain: constants.NetworkName;

  dappName: string;
  description?: string;
  url?: string;
  icons?: string[];
  rpcUrl?: string;
  provider?: ProviderInterface;
};

export abstract class BaseWCConnector extends Connector {
  public options: BaseWCConnectorConstructorOptions;

  public namespace = 'starknet';
  protected signClient!: SignClient;
  protected session?: SessionTypes.Struct;

  private walletRpc: IStarknetRpc;
  private remoteSigner: SignerInterface;
  public provider: ProviderInterface;
  public currentAccount?: AccountInterface;

  constructor(options: BaseWCConnectorConstructorOptions) {
    super();

    this.options = options;

    this.walletRpc = new Proxy({} as IStarknetRpc, {
      get: (_, method: string) => {
        // Somehow toJSON is called on the proxy object, so we need to ignore it
        if (method === 'toJSON') return undefined;

        return (params: unknown) => this.requestWallet({method, params});
      },
    });

    this.remoteSigner = new StarknetRemoteSigner(this.walletRpc);

    this.provider = this.options.provider ?? new RpcProvider({nodeUrl: this.options.rpcUrl});
  }

  /** Handle the connection externally. */
  protected abstract handleConnection(uri: string): Promise<() => void>;

  /** Returns chain name without underscore, eg SNMAIN */
  protected get chain(): string {
    // Removing the underscore from SN_ prefix from the chain name
    return this.options.chain.replace(/^SN_/, 'SN');
  }

  /** Returns namespace with chain, eg starknet:SNMAIN */
  protected get namespaceChain(): string {
    return `${this.namespace}:${this.chain}`;
  }

  protected async initSignClient() {
    if (!this.options.wcProjectId) {
      throw new Error(
        'WC_PROJECT_ID option is not provided. You can get one from https://cloud.walletconnect.com',
      );
    }

    this.signClient = await SignClient.init({
      projectId: this.options.wcProjectId,
      metadata: {
        name: this.options.dappName ?? '',
        description: this.options.description ?? '',
        url: this.options.url ?? '',
        icons: this.options.icons ?? [],
      },
    });

    this.signClient.on('session_delete', () => {
      this.session = undefined;
      this.currentAccount = undefined;
    });
  }

  protected getValidAccounts(session: SessionTypes.Struct): string[] {
    const currentSession = session.namespaces[this.namespace];
    if (!currentSession) return [];

    // Connected accounts are prefixed with the chain and namespace
    // Example: "starknet:SNMAIN:0x028446b7625a071bd169022ee8c77c1aad1e13d40994f54b2d84f8cde6aa458d"
    // We can remove the accounts with wrong chain prefix
    return currentSession.accounts
      .filter((account) => account.startsWith(`${this.namespaceChain}:`))
      .map((account) => account.replace(`${this.namespaceChain}:`, ''));
  }

  protected isValidChain(session: SessionTypes.Struct): boolean {
    return (
      session.requiredNamespaces?.[this.namespace]?.chains?.includes(this.namespaceChain) ?? false
    );
  }

  protected isValidSession(session: SessionTypes.Struct): boolean {
    if (!this.isValidChain(session)) return false;
    if (this.getValidAccounts(session).length === 0) return false;

    return true;
  }

  public async ready() {
    await this.connect();

    return !!this.signClient;
  }

  public async connect() {
    if (!this.signClient) await this.initSignClient();

    const {uri, approval} = await this.signClient.connect({
      requiredNamespaces: {
        [this.namespace]: {
          events: ['chainChanged', 'accountsChanged'],
          methods: [
            `${this.namespace}_supportedSpecs`,
            `${this.namespace}_signTypedData`,
            `${this.namespace}_requestAddInvokeTransaction`,
          ],
          chains: [this.namespaceChain],
        },
      },
    });

    if (!uri) throw new Error('Could not get WC connection URI');

    const handleCleanup = await this.handleConnection(uri);

    this.session = await approval();

    const [account] = this.getValidAccounts(this.session);

    if (!this.isValidChain(this.session)) throw new Error('Invalid chain');

    if (!account) throw new ConnectorNotConnectedError();

    handleCleanup();

    this.currentAccount = new StarknetRemoteAccount(
      this.provider,
      account,
      this.remoteSigner,
      this.walletRpc,
    );

    return {
      account,
      chainId: BigInt(constants.StarknetChainId[this.options.chain]),
    };
  }

  public async disconnect() {
    if (!this.session) return;

    await this.signClient.disconnect({
      topic: this.session.topic,
      reason: {
        code: 0,
        message: 'User initiated disconnect',
      },
    });

    this.signClient = undefined as unknown as SignClient;
    this.currentAccount = undefined;
  }

  /** Get current account. */
  public async account() {
    if (!this.currentAccount) {
      throw new ConnectorNotConnectedError();
    }

    return this.currentAccount;
  }

  /** Get current chain id. */
  public async chainId() {
    return BigInt(constants.StarknetChainId[this.options.chain]);
  }

  private async requestWallet(request: {method: string; params: any}) {
    if (!this.session) throw new Error('No session');

    return this.signClient.request({
      topic: this.session.topic,
      chainId: this.namespaceChain,
      request,
    });
  }
}
