import { AccountUpdate } from '../data/account-update.dto';
import { IService } from '../common/service/IService';

/**
 * Interface of any Account Update handling services
 */
export interface IEventHandlerService extends IService {

  /** 
   * Generic handling method of an AccountUpdate that has been ingested/indexed
   * @param accountUpd The Account Update event to be processed
   */
  processAccountUpdate(accountUpd: AccountUpdate): Promise<any>;

  /** 
   * Report a status about the dedicated Service
   * @returns a data set specific to the service business
   */
  reportStatus(): any;
}
