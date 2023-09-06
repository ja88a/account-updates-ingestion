import { IService } from './IService';
import Logger from '../../utils/logger';
import { AccountUpdate } from '../../data/account-update.dto';
import { AccountUpdateValidator } from '../../data/class-validator';

/**
 * Common & generic properties & methods for Services
 */
abstract class AService implements IService {
  /** Logger */
  readonly logger = Logger.child({
    label: this.constructor.name,
  });

  /** 
   * Validate if an AccountUpdate instance is valid in terms of
   * supported structure, fields & values.
   * @param accountUpd the account update data set to be validated
   * @see {@link AccountUpdate} to review the applied Code-as-Schema
   */
  async validateAccountUpdate(accountUpd: AccountUpdate) {
    if (accountUpd == undefined)
      throw new Error(`Unprocessable Account Update event: undefined`);
    const validErrors = await AccountUpdateValidator.validate(accountUpd);
    if (validErrors.length > 0) {
      this.logger.warn(
        `Ignoring the non-supported Account Update ${accountUpd.id} v${accountUpd.version}\n${validErrors}`,
      );
      return;
    }
  }

  /** @see {@link IService.init} */
  init(): boolean {
    this.logger.debug('Initializing the service');
    return true;
  }

  /** @see {@link IService.shutdown} */
  shutdown(signal: string): void {
    this.logger.debug('Shutting down the service on Signal: ' + signal);
  }
}

export default AService;
