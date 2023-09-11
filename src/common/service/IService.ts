/**
 * Interface of any services
 */
export interface IService {
  /**
   * Initialization method used for managing the service lifecycle
   * @returns A simple confirmation that init is successful, or not
   */
  init(): boolean;

  /**
   * Report a status about the dedicated Service
   * @returns a data set specific to the service business
   */
  reportStatus(): any;

  /**
   * Shutdown method used for managing the service lifecycle
   * @param signal Signal code used for interrupting the running session
   */
  shutdown(signal: string): void;
}
