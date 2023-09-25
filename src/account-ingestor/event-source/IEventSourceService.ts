import { EEventName } from './constants';
import { IService } from '../common/service/IService';

/**
 * Interface of any source importing account Events
 */
export interface IEventSourceService extends IService {
  /**
   * Register a listener's callback function to handle events matching the provided name, and for which
   * the event payload is made of only 1 argument (data object)
   * @param eventName The events name to filter when the callback should be triggered
   * @param callback The method handling the provided event data type
   * @param context Optional parameter designating the contextual instance (this) in which the callback is to be executed
   */
  registerListener<T>(
    eventName: EEventName,
    callback: { (data: T): Promise<void> },
    context?: any,
  ): void;

  /**
   * Start the monitoring process of externally emitted events.
   *
   * Note: For the imported then reported events to be handled, corresponding listeners must have
   * registered their callback method. Refer to {@link IEventSourceService.registerListener}
   *
   * @returns Nothing is returned but a Promise for possible chaining
   */
  startImportingUpdates(): Promise<void>;

  /**
   * Stop the monitoring process of externally emitted events.
   * @returns Nothing is returned but a Promise for possible chaining
   */
  stopImportingUpdates(): Promise<void>;
}
