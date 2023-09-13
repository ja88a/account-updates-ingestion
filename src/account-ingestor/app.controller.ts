import { Controller, Get, Param, Put } from '@nestjs/common';
import { AppService } from './app.service';
import Logger from './utils/logger';

import { exit } from 'process';
import { MS_CONFIG } from './common/config';
import {
  AccountTimeRange,
  AccountTypeTokenOwners,
  AccountTypeTopTokenOwnerHistory,
  ServiceStatusEvent,
} from './data/service.dto';
import { AccountHandlerCallback } from './event-handler/AccountHandlerCallback';
import { AccountHandlerTokenLeaders } from './event-handler/AccountHandlerTokenLeaders';
import { AccountUpdateIngestor } from './event-ingestor/AccountUpdateIngestor';
import {
  EventSourceServiceMock as EventSourceService,
  EventSourceServiceMock,
} from './event-source/EventSourceServiceMock';
import { EEventName } from './event-source/constants';
import { AccountUpdate } from './data/account-update.dto';

/**
 * Main controller of the application, responsible for the binding of available services
 * and the management of the app lifecycle.
 *
 * A minimal REST API is exposed: http-json
 */
@Controller({
  version: MS_CONFIG.VERSION_PUBLIC,
  path: '',
})
export class AppController {
  /** Logger */
  private readonly logger = Logger.child({
    label: AppController.name,
  });

  /**
   * Default App's main module constructor
   *
   * Benefits from nestjs module's injections @see app.module
   */
  constructor(
    private readonly appService: AppService,
    private readonly eventSource: EventSourceService,
    private readonly eventIngestor: AccountUpdateIngestor,
    private readonly eventHandlerCallback: AccountHandlerCallback,
    private readonly eventHandlerLeader: AccountHandlerTokenLeaders,
  ) {}

  /**
   * Simple ping service for basic monitoring of the app availability
   * @returns `200` http response code & `true` if the app is running
   */
  @Get('/ping')
  getPing(): boolean {
    return true;
  }

  /**
   * Retrieve a complete snapshot of this app status
   * @returns the actually indexed `accounts`, accounts that own
   * the max tokens (`leaderboard`) and the number of callbacks `pending` to be triggered with the associated source accounts
   */
  @Get('/status')
  getStatus(): {
    accounts: AccountUpdate[];
    maxtokens: {
      leaderboard: AccountTypeTokenOwners[];
      history: AccountTypeTopTokenOwnerHistory[];
    };
    pending: any;
  } {
    return {
      accounts: this.eventIngestor.reportStatus(),
      maxtokens: this.eventHandlerLeader.reportStatus(),
      pending: this.eventHandlerCallback.reportStatus(),
    };
  }

  /**
   * Retrieve actual accounts owning the most known number of tokens, grouped by account type.
   * It is designed as a basic leaderboard.
   *
   * Note: the provided account types must be known in advance, else dynamically discovered.
   * @returns a list of account types with their associated top token owners
   */
  @Get('/leaderboard')
  getLeaderboard(): any {
    return this.eventHandlerLeader.reportLeaderboard();
  }

  /**
   * Retrieve the account that owned the max number of token at a given time
   * @param accountType The type of the account. Refer to {@link EAccountType} for a list of official ones
   * @param timems The timestamp expressed in ms: Unix epoch time
   * @return The account ID, if any is known at that time, as well as the time range during which the account was the top tokens owner
   */
  @Get('/accounts/tokenmaxowner/:accountType/:time')
  getAccountWithMaxTokens(
    @Param('accountType') accountType: string,
    @Param('time') timems: number,
  ): AccountTimeRange {
    return this.eventHandlerLeader.retrieveTopOwnerAtTime(accountType, timems);
  }

  /**
   * Enable to restart the casting of mock events' data
   * @returns none
   */
  @Put('/recast')
  recast(): void {
    return this.start();
  }

  /**
   * Stop and shut down the server app
   * @returns none
   */
  @Put('/shutdown')
  shutdown(): void {
    this.stop(true);
  }

  /// =================================================================

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
   * `Source` <--listens- `Ingestor` -triggers--> `Handler`
   */
  private bindServices() {
    // Register the app controller to get updates on the source service, service related
    this.eventSource.registerListener(
      EEventName.SERVICE_UPDATE,
      this.handleServiceEvent,
      this,
    );

    // Register the Account Update Ingesting service to handle corresponding events
    this.eventSource.registerListener(
      EEventName.ACCOUNT_UPDATE,
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
  private start(): void {
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
   * If not, stop the app
   */
  private stopOnceAllCallbackAreTiggered() {
    const callbacksStatus = this.eventHandlerCallback.reportStatus();
    if (callbacksStatus.callbacks > 0) {
      setTimeout(() => {
        this.stopOnceAllCallbackAreTiggered();
      }, 500);
    } else {
      this.stop(MS_CONFIG.EXIT_ON_STOP);
    }
  }

  /**
   * Stop the app: log the max tokens' accounts and exit if configured so
   */
  private stop(shutdown: boolean | undefined = false): void {
    // Report the biggest tokens' owner per account type
    const tokenLeaderSatus = this.eventHandlerLeader.reportStatus().leaderboard;
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
   * Default App shutdown method
   *
   * It is bound to the app/shutdown shutdown hooks and gets triggered on any interruptions.
   *
   * @param signal Signal at the origin of this shutdown call
   */
  async onApplicationShutdown(signal: string): Promise<void> {
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
