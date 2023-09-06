import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import Logger from './utils/logger';

import {
  EventSourceServiceMock as EventSourceService,
  EventSourceServiceMock,
} from './event-source/EventSourceServiceMock';
import { EventIngestorService } from './event-ingestor/EventIngestorService';
import { AccountHandlerCallback } from './event-handler/AccountHandlerCallback';
import { exit } from 'process';
import { EventName } from './event-source/constants';
import { AccountHandlerTokenLeaders } from './event-handler/AccountHandlerTokenLeaders';
import { ServiceStatusEvent } from './data/service.dto';
import { EXIT_ON_STOP } from './common/config';

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
    private readonly eventHandlerCallback: AccountHandlerCallback,
    private readonly eventHandlerLeader: AccountHandlerTokenLeaders,
  ) {}

  @Get()
  getStaticWelcome(): string {
    return this.appService.getHtmlWelcome();
  }

  @Get('/ping')
  getPing(): boolean {
    return true;
  }

  @Get('/leaderboard')
  getStatus(): any {
    return this.eventHandlerLeader.reportLeaderboard();
  }

  /**
   * Default init method for the App and its services
   */
  async onModuleInit() {
    await this.appService.init().catch(async (error: Error) => {
      this.logger.error(
        `Application main service failed to init. Stopping it \n${error}`,
      );
      await this.onApplicationShutdown('INIT_FAIL');
    });

    try {
      this.eventHandlerLeader.init();
      this.eventHandlerCallback.init();
      this.eventIngestor.init();
      this.eventSource.init();
    } catch (error) {
      this.logger.error(`Failed to init services. Stopping the app \n${error}`);
      await this.onApplicationShutdown('INIT_FAIL');
      return;
    }

    this.bindServices();

    this.start();
  }

  /**
   * Bind the services together
   *
   * source -co-> ingest -> handle
   */
  private bindServices() {
    this.eventSource.registerListener(
      EventName.SERVICE_UPDATE,
      this.handleServiceEvent,
      this,
    );

    // Register the Account Update Ingesting service to handle corresponding events
    this.eventSource.registerListener(
      EventName.OC_ACCOUNT_UPDATE,
      this.eventIngestor.ingestAccountUpdate,
      this.eventIngestor,
    );

    // Register the  Account Update Handlers to the Ingesting service to be notified on newly indexed update
    this.eventIngestor.registerAccountUpdateHandler(this.eventHandlerCallback);
    this.eventIngestor.registerAccountUpdateHandler(this.eventHandlerLeader);
  }

  /**
   * Start listening to account update events [and casting them]
   * as well as having them handled for their indexation
   */
  start() {
    this.logger.info(
      'Start the Account Update events casting & ingestion session',
    );

    // Launch the casting of Account Update events
    this.eventSource.startMonitoringEvents().catch(async (error: Error) => {
      this.logger.error(
        `Events Sourcing service failed to start monitoring for events. Stopping the app\n${error}`,
      );
      await this.onApplicationShutdown('INIT_FAIL');
    });
  }

  /**
   * Callback used for handling service update events
   * @param statusEvent Event expressing a service status update
   * @returns
   */
  async handleServiceEvent(statusEvent: ServiceStatusEvent): Promise<void> {
    if (statusEvent == undefined) return;

    if (
      statusEvent.source == EventSourceServiceMock.name &&
      statusEvent.active == false
    ) {
      // The casting of mock event is over: report info & shutdown the app once all callbacks have triggered
      this.stopOnceAllCallbackAreTiggered();
    }
  }

  /**
   * Check if there are AccountUpdate callbacks still pending
   */
  stopOnceAllCallbackAreTiggered() {
    const callbacksStatus = this.eventHandlerCallback.reportStatus();
    if (callbacksStatus.callbacks > 0) {
      setTimeout(() => {
        this.stopOnceAllCallbackAreTiggered();
      }, 500);
    } else {
      this.stop(EXIT_ON_STOP);
    }
  }

  /**
   *
   */
  stop(shutdown: boolean | undefined = false) {
    // Report the biggest tokens' owner per account type
    const tokenLeaderSatus = this.eventHandlerLeader.reportStatus();
    let textReport = '';
    tokenLeaderSatus.forEach((entry) => {
      textReport += `\t${entry.type}\t${entry.type.length < 8 ? '\t' : ''}${
        entry.accounts[0].id
      }\t${entry.accounts[0].tokens} tokens\n`;
    });
    this.logger.info(`Max tokens owner, per account type:\n${textReport}`);

    if (shutdown) this.onApplicationShutdown('DONE');
  }

  /**
   * Default shutdown method
   * @param signal Signal at the origin of this shutdown call
   */
  async onApplicationShutdown(signal: string) {
    this.logger.warn('Shutting down Main App on signal ' + signal); // e.g. "SIGINT"

    try {
      if (this.eventSource) this.eventSource.shutdown(signal);
      if (this.eventIngestor) this.eventIngestor.shutdown(signal);
      if (this.eventHandlerCallback) this.eventHandlerCallback.shutdown(signal);
      if (this.eventHandlerLeader) this.eventHandlerLeader.shutdown(signal);
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
