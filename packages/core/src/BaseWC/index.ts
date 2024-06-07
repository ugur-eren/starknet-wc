import SignClient from '@walletconnect/sign-client';
import type {SessionTypes} from '@walletconnect/types';
import {constants} from 'starknet';
import {Connector} from '../Base';

export type BaseAdapterConstructorOptions = {
  wcProjectId: string;
  chain: constants.NetworkName;

  dappName: string;
  description?: string;
  url?: string;
  icons?: string[];
  rpcUrl?: string;
};

export abstract class BaseWCConnector extends Connector {
  public options: BaseAdapterConstructorOptions;

  public namespace = 'starknet';
  protected signClient!: SignClient;
  protected topic?: string;

  constructor(options: BaseAdapterConstructorOptions) {
    super();

    this.options = options;
  }

  /** Handle the connection externally. */
  abstract handleConnection(uri: string): Promise<void>;

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

  /** Whether connector is already authorized */
  abstract ready(): Promise<boolean>;

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

    await this.handleConnection(uri);

    const result = await approval();

    const connectedAccounts = this.getValidAccounts(result);

    if (!this.isValidChain(result)) throw new Error('Invalid chain');

    this.topic = result.topic;

    return {
      account: connectedAccounts[0],
      chainId: BigInt(this.chain),
    };
  }

  public async disconnect() {
    if (!this.signClient || !this.topic) return;

    await this.signClient.disconnect({
      topic: this.topic,
      reason: {
        code: 0,
        message: 'User initiated disconnect',
      },
    });
  }

  /** Get current account. */
  abstract account(): Promise<AccountInterface>;

  /** Get current chain id. */
  abstract chainId(): Promise<bigint>;
}
