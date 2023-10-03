import { AccountUpdate } from '../data/account-update.dto';
import { IService } from '../common/service/IService';
import { IEventHandlerService } from '../event-handler/IEventHandlerService';

/**
 * Interface of any ingestion service of Account Updates
 */
export interface IEventIngestorService extends IService {
  /**
   * Register an Account Update Handler service so that it
   * gets updated when an account update is ingested
   *
   * @param service the target account update handler
   */
  registerAccountUpdateHandler(service: IEventHandlerService): void;

  /**
   * Handling method for ingesting new account update events
   *
   * @param accountEvent New account update event to be ingested
   */
  ingestAccountUpdate(accountEvent: AccountUpdate): Promise<void>;

  /**
   * Flush out all actually indexed Account Update that the service has registered so far.
   *
   * @returns The list of all indexed account updates
   */
  flushOutAccountUpdates(): AccountUpdate[];
}
