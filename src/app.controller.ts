import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import Logger from './utils/logger';

import { EventSourceServiceMock as EventSourceService } from './event-source/EventSourceServiceMock';
import { EventIngestorService } from './event-ingestor/EventIngestorService';
import { EventHandlerService } from './event-handler/EventHandlerService';
import { AccountUpdate } from './data/account-event.dto';
import { exit } from 'process';

@Controller()
export class AppController {
  /** Logger */
  private readonly logger = Logger.child({
    label: AppController.name,
  });

  constructor(
    private readonly appService: AppService,
    private readonly eventSource: EventSourceService,
    private readonly eventIngestor: EventIngestorService,
    private readonly eventHandler: EventHandlerService,
  ) {}

  @Get()
  getStaticWelcome(): string {
    return this.appService.getHtmlWelcome();
  }

  /**
   * Default init method for the App and its services
   */
  async onModuleInit() {
    this.logger.warn('Start Initialization Process');
    await this.appService.init().catch(async (error: Error) => {
      this.logger.error(
        `Application main service failed to init. Stopping it \n${error}`,
      );
      await this.onApplicationShutdown('INIT_FAIL');
    });

    try {
      this.eventIngestor.init();
      this.eventSource.init();
    } catch (error) {
      this.logger.error(`Failed to init services. Stopping the app \n${error}`);
      await this.onApplicationShutdown('INIT_FAIL');
    }

    this.start();
  }

  /**
   * Start listening to account update events [and casting them]
   * as well as having them handled for indexation
   */
  start() {
    //this.eventSource.addListenerToAccountEvents((event: AccountUpdate) => this.eventIngestor.handleAccountUpdateEvent(event));
    this.eventSource.addListenerToAccountEvents(
      this.eventIngestor.handleAccountUpdateEvent, this.eventIngestor
    );

    this.eventSource
      .startMonitoringEvents()
      .then()
      .catch(async (error: Error) => {
        this.logger.error(
          `Events Sourcing service failed to start monitoring for events. Stopping the app\n${error}`,
        );
        await this.onApplicationShutdown('INIT_FAIL');
      });
  }

  /**
   * Default shutdown method
   * @param signal Signal at the origin of this shutdown call
   */
  async onApplicationShutdown(signal: string) {
    this.logger.warn('Shutting down Main App on signal ' + signal); // e.g. "SIGINT"

    try {
      if (this.eventSource)
        this.eventSource.shutdown(signal);
      if (this.eventIngestor)
        this.eventIngestor.shutdown(signal);
    } catch (error) {
      this.logger.error(
        `Failed to properly shut down all Services \n${error}`,
        error,
      );
    }

    if (this.appService)
      await this.appService.shutdown(signal).catch((error: Error) => {
        this.logger.error(`Improper App shutdown: ${error.message}`, error);
      });

    exit();
  }
}
