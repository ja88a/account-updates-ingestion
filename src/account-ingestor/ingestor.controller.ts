import { Controller, Get, Param, Put } from '@nestjs/common';
import { AccountIngestorService } from './ingestor.service';
import Logger from '../common/logger';

import { exit } from 'process';
import {
  EProcessExitSignal,
  EXIT_MAX_WAIT_MS,
  MS_CONFIG,
} from '../common/config';
import { AccountTimeRange, ServiceStatusEvent } from './data/service.dto';
import { AccountHandlerCallback } from './event-handler/AccountHandlerCallback';
import { AccountHandlerTokenLeaders } from './event-handler/AccountHandlerTokenLeaders';
import { AccountUpdateIngestor } from './event-ingestor/AccountUpdateIngestor';
import {
  EventSourceServiceMock as EventSourceService,
  EventSourceServiceMock,
} from './event-source/EventSourceServiceMock';
import { EEventName } from './event-source/constants';
import { EAccountType } from './data/account-update.dto';
import { ApiParam, ApiTags } from '@nestjs/swagger/dist/decorators';
import { OutputAppStates } from './data/rest-api.dto';

/**
 * Main controller of the application, responsible for the binding of available services
 * and the management of the app lifecycle.
 *
 * A minimal REST API is exposed: http-json
 */
@ApiTags('Account Ingestor')
@Controller({
  version: MS_CONFIG.VERSION_PUBLIC,
  path: '',
})
export class AccountIngestorController {
  /** Logger */
  private readonly logger = Logger.child({
    label: AccountIngestorController.name,
  });

  /**
   * Default App's main module constructor
   *
   * Benefits from nestjs modules' injection @see {@link AccountIngestorModule}
   */
  constructor(
    private readonly appService: AccountIngestorService,
    private readonly updSource: EventSourceService,
    private readonly updIngestor: AccountUpdateIngestor,
    private readonly updHandlerCallback: AccountHandlerCallback,
    private readonly updHandlerLeader: AccountHandlerTokenLeaders,
  ) {}

  /// =================================================================
  /// == Controller main REST APIs
  /// ============================

  /**
   * Simple ping service for basic monitoring of the app's online availability
   * @returns `200` http response code & `true` if the app is running
   */
  @Get('/ping')
  getPing(): boolean {
    return this.appService?.isConnected();
  }

  /**
   * Retrieve a complete snapshot of the app services' states
   * @returns the actually indexed `accounts`, accounts that own
   * the max tokens (`leaderboard`) and the number of callbacks `pending` to be triggered with the associated source accounts
   */
  @Get('/status')
  getStatus(): OutputAppStates {
    return {
      accounts: this.updIngestor.reportStatus(),
      maxtokens: this.updHandlerLeader.reportStatus(),
      pending: this.updHandlerCallback.reportStatus(),
    };
  }

  /**
   * Retrieve actual accounts owning the most known number of tokens, grouped by account type.
   * It is designed as a basic leaderboard.
   *
   * Note: the provided account types must be known in advance, else dynamically discovered.
   * @returns a list of account types with their associated top token owners
   */
  @Get('/accounts/leaderboard')
  getLeaderboard(): any {
    return this.updHandlerLeader.reportLeaderboard();
  }

  /**
   * Retrieve the account that owned the max number of token at a given time
   * @param accountType The type of the account. Refer to {@link EAccountType} for a list of the officially supported ones
   * @param timems The timestamp expressed in ms: Unix epoch time
   * @return The account ID, if any is known at that time, as well as the time range during which the account was the top tokens owner
   */
  @Get('/accounts/maxhodler/:accountType/:time')
  @ApiParam({
    name: 'accountType',
    required: true,
    description: 'The target type of accounts to retrieve',
    type: 'string',
    enum: EAccountType,
  })
  @ApiParam({
    name: 'time',
    required: true,
    description: 'The timestamp expressed in ms: Unix epoch time',
    type: 'number',
    example: Date.now() + 10_000,
  })
  getAccountWithMaxTokens(
    @Param('accountType') accountType: string,
    @Param('time') timems: number,
  ): AccountTimeRange {
    return this.updHandlerLeader.retrieveTopOwnerAtTime(accountType, timems);
  }

  /**
   * Start a new casting session of the mocked account updates
   * @returns none
   */
  @Put('/mock/recast')
  recast(): Promise<void> {
    this.updIngestor.flushOutAccountUpdates();
    return this.updSource.startImportingUpdates();
  }

  /**
   * Stop and shut down the server app
   * @returns none
   */
  @Put('/shutdown')
  async shutdown(): Promise<void> {
    await this.onApplicationShutdown(EProcessExitSignal.SIGRPC);
  }

  /// =================================================================
  /// Services Management & App Lifecycle
  /// ===================================

  /**
   * Default init method for the App and its services
   */
  async onModuleInit() {
    await this.appService.init().catch(async (error: Error) => {
      this.logger.error(
        `Application main service failed to init. Stopping it \n${error}`,
      );
      await this.onApplicationShutdown(EProcessExitSignal.INIT_FAIL);
    });

    try {
      this.updHandlerLeader.init();
      this.updHandlerCallback.init();
      this.updIngestor.init();
      this.updSource.init();
    } catch (error) {
      this.logger.error(
        `Failed to init services. Stopping the app \n${error}`,
        error,
      );
      await this.onApplicationShutdown(EProcessExitSignal.INIT_FAIL);
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
    this.updSource.registerListener(
      EEventName.SERVICE_UPDATE,
      this.handleServiceEvent,
      this,
    );

    // Register the Account Update Ingesting service to handle corresponding events
    this.updSource.registerListener(
      EEventName.ACCOUNT_UPDATE,
      this.updIngestor.ingestAccountUpdate,
      this.updIngestor,
    );

    // Register the  Account Update Handlers to the Ingesting service to be notified on newly indexed update
    this.updIngestor.registerAccountUpdateHandler(this.updHandlerCallback);
    this.updIngestor.registerAccountUpdateHandler(this.updHandlerLeader);
  }

  /**
   * Start listening to account update events [and casting them]
   * as well as having them handled for their indexation
   */
  private start(): void {
    this.logger.info('Start the casting & ingestion of Account Update events');

    // Launch the casting of Account Update events
    this.updSource.startImportingUpdates().catch(async (error: Error) => {
      this.logger.error(
        `Events Sourcing service failed to start monitoring for events. Stopping the app\n${error}`,
        error,
      );
      await this.onApplicationShutdown(EProcessExitSignal.INIT_FAIL);
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
      // The casting of mock updates is over: report info
      if (MS_CONFIG.EXIT_ON_STOP) {
        // shutdown the app
        this.onApplicationShutdown(
          statusEvent.leftover == 0
            ? EProcessExitSignal.DONE
            : EProcessExitSignal.LEFTOVER,
        );
      }
    }
  }

  /**
   * Check if there are AccountUpdate callbacks still pending.
   *
   * A maximum wait time is set by default: {@link EXIT_MAX_WAIT_MS}
   *
   * @param signal Specification of the process exit signal, required only if app is expected to shutdown
   * @param startTime Optional specification of the waiting process start time
   */
  private async waitUntilAllCallbacksLeftTrigger(
    signal: string,
    startTime: number | undefined = Date.now(),
  ): Promise<void> {
    // Make sure the waiting period is not too long
    const actualTime = Date.now();
    // Check if it takes too long or if we keep waiting
    const keepWaiting = startTime + EXIT_MAX_WAIT_MS > actualTime;

    // Get the actual pending callbacks
    const callbacksStatus = this.updHandlerCallback.reportStatus();

    this.logger.debug(
      `Shall we wait? ${keepWaiting} leftOver: ${
        callbacksStatus.callbacks
      } timeLeft: ${(startTime + EXIT_MAX_WAIT_MS - actualTime) / 1000}s`,
    );

    if (keepWaiting && callbacksStatus.callbacks > 0) {
      // Delay the call for checking again if there are still pending callback triggers
      await new Promise((resolve) => setTimeout(resolve, 500));
      await this.waitUntilAllCallbacksLeftTrigger(signal, startTime);
    }
  }

  /**
   * Stop the app services
   */
  private async stop(): Promise<void> {
    // Stop feeding the ingestor with external inputs
    this.updSource.stopImportingUpdates();
  }

  /**
   * Default graceful App shutdown method
   *
   * It is bound to the Nodejs shutdown hooks and gets triggered on any interruptions.
   *
   * @param signal Signal at the origin of this shutdown call, e.g. `SIGINT`
   * @see {@link EProcessExitSignal} for the app specific signals
   */
  async onApplicationShutdown(signal: string): Promise<void> {
    if (signal == EProcessExitSignal.DONE) {
      this.logger.warn(`Shutting down the app - Job ${signal}`);
    } else {
      this.logger.warn(`Graceful App Shutdown required on signal ${signal}`);
      await this.stop();
    }

    // Wait for all pending callbacks to be triggered before leaving
    await this.waitUntilAllCallbacksLeftTrigger(signal);

    // DEMO - Report the biggest tokens' owner per account type, before leaving
    const tokenLeaderSatus = this.updHandlerLeader.reportStatus().leaderboard;
    let textReport = '';
    tokenLeaderSatus.forEach((entry) => {
      textReport += `\t${entry.type}\t${entry.type.length < 8 ? '\t' : ''}${
        entry.accounts[0].id
      }\t${entry.accounts[0].tokens} tokens\n`;
    });
    if (tokenLeaderSatus.length > 0)
      this.logger.info(`Max tokens holder, per account type:\n${textReport}`);

    // Shut them all down
    try {
      if (this.updSource) this.updSource.shutdown(signal);
      if (this.updIngestor) this.updIngestor.shutdown(signal);
      if (this.updHandlerCallback) this.updHandlerCallback.shutdown(signal);
      if (this.updHandlerLeader) this.updHandlerLeader.shutdown(signal);
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
