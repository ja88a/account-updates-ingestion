import { Injectable } from '@nestjs/common';
import { IEventHandlerService } from './IEventHandlerService';
import AService from '../common/service/AService';
import { AccountUpdate } from '../data/account-update.dto';
import { AccountHandlerCallbackStatus } from '../data/service.dto';

/**
 * Account Updates' callback manager.
 * * Process the new Account Update by scheduling their callback & cancelling those replaced by a newer account update [version]
 * * Report a status on still active callbacks: their number and originating/target account
 */
@Injectable()
export class AccountHandlerCallback
  extends AService
  implements IEventHandlerService
{
  /** Record table of the account updates' still active callback and
   * the mean to cancel their scheduling */
  private callbackTimeout: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Manage a callback to be triggered after the delay specified in the
   * account update.
   *
   * Cancel any previously scheduled callback if a new account update
   * is received before the previous one's experiration.
   *
   * @see {@link IEventHandlerService.processAccountUpdate}
   */
  async processAccountUpdate(accountUpd: AccountUpdate): Promise<boolean> {
    // Check inputs
    const issues = await this.validateAccountUpdate(accountUpd);
    if (issues.length > 0) {
      this.logger.warn(
        `Ignoring ${accountUpd.id} v${accountUpd.version} - Not processing`,
      );
      return false;
    }

    // Check if a callback is already registered for that account
    const existingCallbackTimeout = this.callbackTimeout.get(accountUpd.id);

    // Cancel previous callback
    if (existingCallbackTimeout) {
      clearTimeout(existingCallbackTimeout);
      this.callbackTimeout.delete(accountUpd.id);
      this.logger.info(`Callback CANCELLED for ${accountUpd.id} (replaced)`);
    }

    // Register the account update Callback
    const newTimeout = setTimeout(() => {
      this.logger.info(
        `Callback TRIGGERED for ${accountUpd.id} v${accountUpd.version}`,
      );
      this.callbackTimeout.delete(accountUpd.id);
    }, accountUpd.callbackTimeMs);
    this.callbackTimeout.set(accountUpd.id, newTimeout);

    return true;
  }

  /**
   * Report a status on the number of active/pending callbacks and the list of related AccountUpdate ID
   *
   * @override {@link AService.reportStatus}
   * @returns The number of active/pending `callbacks` and the ID of their associated source Account in `accounts`
   */
  reportStatus(): AccountHandlerCallbackStatus {
    const report = {
      callbacks: this.callbackTimeout.size,
      accounts: [...this.callbackTimeout.keys()],
    };
    return report;
  }

  /**
   * @override {@link AService}
   */
  shutdown(signal: string): void {
    this.callbackTimeout.forEach((entry) => {
      clearTimeout(entry);
    });
    this.callbackTimeout.clear();
    super.shutdown(signal);
  }
}
