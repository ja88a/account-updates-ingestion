import { Injectable } from '@nestjs/common';
import { IEventSourceService } from './IEventSourceService';
import Logger from '../utils/logger';

import {
  classToPlain,
  instanceToPlain,
  plainToClass,
  plainToInstance,
} from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { AccountUpdate, AccountUpdateList } from '../data/account-event.dto';
import { VALID_OPT } from '../common/config';

import { EventEmitter } from 'node:events';
import { MOCK_DATA_URL_DEFAULT, EventName } from './constants';

/**
 * This service loads a set of logged onchain events, and validate them before
 * exposing them to any consumer.
 *
 * It is a mock implementation of a real-time data streaming services.
 * * A JSON data set is fetched from a static JSON file URL
 * * The loaded contents are validated as being compliant with the supported data schema
 * * A data streaming is then emulated to randomly cast the events over time, sequentially
 * * Listeners having registered have their callback triggered for the Account Update events
 *
 * @implements IEventSourceService
 */
@Injectable()
export class EventSourceServiceMock implements IEventSourceService {
  /** Logger */
  private readonly logger = Logger.child({
    label: EventSourceServiceMock.name,
  });

  /** A general events emitter to support the handling of new Account update Events */
  private eventEmitter: EventEmitter = new EventEmitter();

  /** Tracking of the last set timeout used to sequentially cast account update events, if any is active */
  private eventCastingTimeout: NodeJS.Timeout | undefined;

  /** URL of the JSON file to be fetched for populating a sample data set (mock) */
  private jsonMockFileUrl: string = MOCK_DATA_URL_DEFAULT;

  /**
   * Add a listener, a callback function, to handle the events of type `StreamEventName.OC_ACCOUNT_UPDATE`
   * @param callback The listener's callback function responsible for handling the provided `AccountEvent`
   */
  // addListenerToAccountEvents(callback: {
  //   (event: AccountUpdate): Promise<void>;
  // }) {
  //   this.eventStream.on(
  //     EventName.OC_ACCOUNT_UPDATE,
  //     (data: AccountUpdate) => callback,
  //   );
  // }
  addListenerToAccountEvents(
    callback: {
      (event: AccountUpdate): Promise<void>;
    },
    context: any,
  ) {
    this.eventEmitter.on(EventName.OC_ACCOUNT_UPDATE, (data: AccountUpdate) => {
      callback.bind(context)(data);
    });
  }

  registerListener<T>(
    eventName: EventName,
    callback: { (data: T): Promise<void> },
    context?: any,
  ): void {
    this.eventEmitter.on(eventName, (data: T) => {
      callback.bind(context)(data);
    });
  }

  /**
   * Set a new file URL as source of mock data
   * @param newStaticJsonFileUrl URL to the JSON file, e.g. `https://whatever.com/account-update-logs.json`
   */
  setJsonMockFileUrl(newStaticJsonFileUrl: string) {
    this.jsonMockFileUrl = newStaticJsonFileUrl;
  }

  /**
   * Load a data set of Account Updates logs by fetching it from a provided JSON file URI.
   *
   * Convert the loaded objects into a list of `AccountEvent` and validate their consistency/support.
   *
   * @param staticJsonFileUrl File URL used for fetching its JSON content
   * @returns The list of loaded `AccountEvent` and their associated validation errors, if any
   */
  private async _loadAccountEventsFromUrl(staticJsonFileUrl: string) {
    // Load
    const resp = await fetch(staticJsonFileUrl);
    if (!resp.ok) {
      throw new Error(
        `Failed to fetch Account Events mock data from '${staticJsonFileUrl}' HTTP error: ${resp.status}`,
      );
    }

    // Transform
    let jsonRaw = await resp.text();
    const eventLogs: AccountUpdateList = plainToInstance(
      AccountUpdateList,
      JSON.parse(`{"list":${jsonRaw}}`),
    );

    // Validate
    let validationErr: ValidationError[] = [];
    validationErr = await this.validateAll(eventLogs.list);

    return {
      events: eventLogs.list,
      validationErrors: validationErr,
    };
  }

  /**
   * Validate a account update event and provide fields & values validation errors if any
   * @param eventLog the account update event to validate
   * @return List of validation errors, if any. Else an empty array.
   */
  async validate(eventLog: AccountUpdate): Promise<ValidationError[]> {
    const validationErr: ValidationError[] = await validate(
      eventLog,
      VALID_OPT,
    ).catch((error) => {
      throw new Error(
        `Failed to validate the account update event ${eventLog.id} ${eventLog.accountType} v${eventLog.version} \n${error}`,
      );
    });

    if (validationErr.length > 0) {
      this.logger.warn(
        `Validation of event ${eventLog.id}_${eventLog.accountType}_v${eventLog.version} results in ${validationErr.length} issue(s): \n${validationErr}`,
      );
    }
    return validationErr;
  }

  /**
   * Validate a list of logged onchain events (fields & values validation issues)
   * @param eventLogs the list of account events to validate
   * @return List of validation errors, if any. Else an empty array.
   */
  async validateAll(eventLogs: AccountUpdate[]): Promise<ValidationError[]> {
    let validationErr: ValidationError[] = [];
    for (let i = 0; i < eventLogs.length; i++) {
      await this.validate(eventLogs[i])
        .then((validErr) => {
          validationErr = validationErr.concat(validErr);
        })
        .catch((error) => {
          throw new Error(
            `Batch validation of ${eventLogs.length} account update events aborted at index ${i} \n${error}`,
          );
        });
    }

    if (validationErr.length > 0) {
      this.logger.warn(
        `Validation of ${eventLogs.length} events resulted in ${validationErr.length} issue(s)`,
      );
    }
    return validationErr;
  }

  async startMonitoringEvents(): Promise<void> {
    // Load the data sets of Account Events
    await this._loadAccountEventsFromUrl(this.jsonMockFileUrl)
      .then((results) => {
        this.logger.info(
          `${results.events.length} account updates available for casting`,
        );

        // Start casting the events to emulate their real-time streaming
        this.castAccountEvents(results.events.reverse());
      })
      .catch((error) => {
        throw new Error(
          `Failed to load events from mock data file '${this.jsonMockFileUrl}' ${error}`,
        );
      });
  }

  /**
   * Cast sequentially account update events.
   *
   * Real-time casting is simulated using a random duration between 2 events casting.
   * The provided list of events to be cast gets reduced over time, i.e. once an event is sent it is removed from the list
   * @param accountEvents The ordered FIFO list of account update events left to be cast
   */
  private castAccountEvents(accountEvents: AccountUpdate[]) {
    if (!accountEvents)
      throw new Error(`No Account Events provided for casting `);
    if (accountEvents.length == 0) {
      this.eventCastingTimeout = undefined;
      this.logger.info(`Events casting done`);
      return;
    }

    this.logger.debug(
      `Casting event ${accountEvents[accountEvents.length - 1].id}_${
        accountEvents[accountEvents.length - 1].accountType
      }_v${accountEvents[accountEvents.length - 1].version}`,
    );

    // Generate a random number (integer) within the range [0; 1000]
    const timeoutMs = Math.floor(Math.random() * 1001);

    // Emit an event, remove the cast one from the FIFO & loop back to send next event sequentually
    this.eventCastingTimeout = setTimeout(() => {
      const accountEvt = accountEvents.pop();
      if (accountEvt) {
        this.emitAccountEvent(accountEvt);
        this.castAccountEvents(accountEvents);
      }
    }, timeoutMs);
  }

  /**
   * Emit an account update event to the stream for listeners's callback to handle it
   * @param data The `data.AccountEvent` dataset to provide to listeners
   */
  private emitAccountEvent(data: AccountUpdate) {
    const result = this.eventEmitter.emit(EventName.OC_ACCOUNT_UPDATE, data);
    if (!result)
      this.logger.warn(
        `No listeners found for events '${EventName.OC_ACCOUNT_UPDATE}'`,
      );
  }

  /**
   * Remove all listeners of the events emitter and stop casting new events
   */
  private _stopEventsHandling() {
    if (this.eventEmitter) this.eventEmitter.removeAllListeners();
    if (this.eventCastingTimeout) {
      clearTimeout(this.eventCastingTimeout);
      this.eventCastingTimeout = undefined;
    }
  }

  init(): boolean {
    this.logger.info('Initializing the service');
    return true;
  }

  shutdown(signal: string): void {
    this.logger.info('Shutting down the service on Signal: ' + signal);
    this._stopEventsHandling();
  }
}
