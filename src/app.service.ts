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
    return '<html><body style="font-family:sans-serif;color:white;background-color:black;">' +
      '<h2>Cheers ME!</h2><h3>BR from EU</h3>'+
      '<img src="/arch-overview_diag01t.png"/></body></html>';
  }

  /**
   * Initialization of the module.
   *
   * Throws an Error exception if an issue is met
   */
  async init(): Promise<void> {
    this.logger.debug('Initializing the service');
  }

  /**
   * Shutdown of the service, expected to be a clean one
   * @param signal Signal at the origin of this service shutdown, e.g. `SIGINT`
   */
  async shutdown(signal: string) {
    this.logger.debug('Shutting down the App main service on signal ' + signal);
  }
}