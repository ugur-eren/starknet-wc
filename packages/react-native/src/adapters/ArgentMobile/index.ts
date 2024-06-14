import {BaseWCConnector, type BaseWCConnectorConstructorOptions} from 'core';
import {DEFAULT_ARGENT_MOBILE_ICON} from './constants';

export class ArgentMobileConnector extends BaseWCConnector {
  public id = 'argentMobile';
  public name = 'Argent (mobile)';
  public icon = {
    light: DEFAULT_ARGENT_MOBILE_ICON,
    dark: DEFAULT_ARGENT_MOBILE_ICON,
  };

  public available() {
    return true;
  }

  protected handleConnection: (uri: string) => Promise<() => void>;

  constructor(
    options: BaseWCConnectorConstructorOptions,
    handleConnection: (uri: string) => Promise<() => void>,
  ) {
    super(options);

    this.handleConnection = handleConnection;
  }
}
