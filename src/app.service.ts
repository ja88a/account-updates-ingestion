import { Injectable } from '@nestjs/common';
import Logger from './utils/logger';

@Injectable()
export class AppService {
  /** Logger */
  private readonly logger = Logger.child({
    label: AppService.name,
  });
  
  /** 
   * Provides a static HTML content
   */
  getHtmlWelcome(): string {
    return 'Hello World!';
  }

  /** 
   * Initialization of the module.
   * 
   * Throws an Error exception if an issue is met
   */
  async init(): Promise<void> {
    this.logger.debug("Starting initialization");
  }

  /**
   * Shutdown of the service, expected to be a clean one
   * @param signal Signal at the origin of this service shutdown, e.g. `SIGINT`
   */
  async shutdown(signal: string) {
    this.logger.info('Shutting down the App main service on signal ' + signal);
  }

}
