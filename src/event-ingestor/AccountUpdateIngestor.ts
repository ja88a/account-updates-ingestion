import { Injectable } from '@nestjs/common';
import { AccountUpdate } from '../data/account-update.dto';
import { AccountUpdateValidator } from '../data/class-validator';
import AService from '../common/service/AService';
import { IEventIngestorService } from './IEventIngestorService';
import { IEventHandlerService } from '../event-handler/IEventHandlerService';

/**
 * Account Update ingestion service: Indexing of new updates
 * only if they are valid in terms of structure, fields and supported values.
 *
 * Only the latest account update is indexed (in memory here). This is performed by considering update version:
 * higher version number means more recent.
 *
 * Assumption: the account ID is considered as unique, and is bound to only one account type.
 *
 * Refer to the implemented Code-as-Schema in {@link AccountUpdate} for more info about their validation procedure.
 *
 * @see {@link IEventIngestorService}
 * @override {@link AService}
 */
@Injectable()
export class AccountUpdateIngestor
  extends AService
  implements IEventIngestorService
{
  /** Indexed account updates. A map of `account.id` towards their most up-to-date update dataset */
  private accounts: Map<string, AccountUpdate> = new Map();

  /** A list of registered account update handlers */
  private updateHandlers: IEventHandlerService[] = [];

  /**
   * @see {@link IEventIngestorService.ingestAccountUpdate}
   */
  async ingestAccountUpdate(accountEvent: AccountUpdate) {
    // Consider only valid account update events
    const validationErrors =
      await AccountUpdateValidator.validate(accountEvent);
    if (validationErrors.length > 0) {
      this.logger.warn(
        `Ignoring AccountUpdate ${accountEvent.id} ${accountEvent.version} - Not indexing`,
      );
      return;
    }

    // Check if already indexed, if so compare the versions to keep the latest only
    const indexedAccountUpdate = this.accounts.get(accountEvent.id);
    if (
      indexedAccountUpdate == undefined ||
      accountEvent.version > indexedAccountUpdate.version
    ) {
      // Register / Ingest latest update version
      this.accounts.set(accountEvent.id, accountEvent);
      this.logger.info(
        `Indexing Update v${accountEvent.version} for ${accountEvent.id}`,
      );
      // Trigger its handling
      this.triggerAccountUpdateHandling(accountEvent);
    }
  }

  /**
   * Call the registered account update handlers for action
   * @param accountUpd the account update to be passed to registered handlers
   */
  triggerAccountUpdateHandling(accountUpd: AccountUpdate) {
    this.updateHandlers.forEach((handler) => {
      handler.processAccountUpdate(accountUpd);
    });
  }

  /**
   * @see {@link IEventIngestorService.registerAccountUpdateHandler}
   */
  registerAccountUpdateHandler(service: IEventHandlerService): void {
    if (service == undefined)
      throw new Error(
        `Attempt to register an undefined account update handler`,
      );

    this.updateHandlers.push(service);
  }

  /**
   * @see {@link IService.reportStatus}
   * @override {@link AService.reportStatus}
   * @returns The complete list of accounts and their last indexed update info
   */
  reportStatus(): Array<{ accountId: string; lastUpdate: AccountUpdate }> {
    return Array.from(this.accounts, function (entry) {
      return { accountId: entry[0], lastUpdate: entry[1] };
    });
  }

  /**
   * @override {@link AService.shutdown}
   */
  shutdown(signal: string) {
    this.updateHandlers = [];
    this.accounts.clear();
    super.shutdown(signal);
  }
}
