import { Injectable } from '@nestjs/common';
import { IEventHandlerService } from './IEventHandlerService';
import AService from '../common/service/AService';
import { AccountUpdate } from '../data/account-update.dto';
import { arrayBuffer } from 'stream/consumers';
import { AccountUpdateValidator } from 'src/data/class-validator';

@Injectable()
export class AccountHandlerCallback
  extends AService
  implements IEventHandlerService
{
  private callbackTimeout: Map<string, NodeJS.Timeout> = new Map();

  async processAccountUpdate(accountUpd: AccountUpdate): Promise<void> {
    // Check inputs
    await this.validateAccountUpdate(accountUpd);

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
      this.logger.info(`Callback TRIGGERED for ${accountUpd.id} v${accountUpd.version}`);
      this.callbackTimeout.delete(accountUpd.id)
    }, accountUpd.callbackTimeMs);
    this.callbackTimeout.set(accountUpd.id, newTimeout);
  }

  /**
   * Report a status on the number of active/pending callbacks and the list of related AccountUpdate ID
   * @returns the number of active `callbacks` and the ID of AccountUpdate in `accounts`
   */
  reportStatus(): { callbacks: number, accounts: string[] } {
    const report = {
      callbacks: this.callbackTimeout.size,
      accounts: [...this.callbackTimeout.keys()]
    };
    return report;
  }

  /**
   * @override {@link AService.shutdown}
   */
  shutdown(signal: string): void {
    this.callbackTimeout.forEach(entry => {
      clearTimeout(entry);
    });
    this.callbackTimeout.clear();
    super.shutdown(signal);
  }
  
}
