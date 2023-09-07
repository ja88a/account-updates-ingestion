/**
 * Interface of any services
 */
export interface IService {
  /**
   * Initialization method used for managing the service lifecycle
   * @returns Promise<void>
   */
  init(): boolean;

  /**
   * Shutdown method used for managing the service lifecycle
   * @param signal Signal code used for
   */
  shutdown(signal: string): void;
}
