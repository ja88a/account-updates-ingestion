import { ValidationError } from 'class-validator';
import { AccountUpdate } from '../data/account-event.dto';
import { EventName } from './constants';
import { IService } from '../common/IService';

/** 
 * Interface of any source importing account Events 
 */
export interface IEventSourceService extends IService {

  /**
   * Register a listener's callback function to handle events which payload is made of only 1 data object
   * @param eventName The events name to filter when the callback should be triggered
   * @param callback The method handling the provided event data type
   * @param context Optional context parameter designating the instance (this) where the callback is to be executed
   */
  registerListener<T>(eventName: EventName, callback: { (data: T): Promise<void> }, context?: any): void;

  /** 
   * Start the monitoring process of externally emitted events
   * @returns An event stream where new events are relayed 
   */
  startMonitoringEvents(): Promise<void>;

  /**
   * Validate the support of a list of events: population, structure, values & consistency
   * @param event The account update event to be validated
   * @returns A list of validation errors collected while validating each event
   */
  validate(event: AccountUpdate): Promise<ValidationError[]>;
}
