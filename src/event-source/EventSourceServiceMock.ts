import { Injectable } from '@nestjs/common';
import { IEventSourceService } from './IEventSourceService';

import { plainToInstance } from 'class-transformer';
import { ValidationError } from 'class-validator';
import { AccountUpdate, AccountUpdateList } from '../data/account-update.dto';

import { EventEmitter } from 'node:events';
import AService from '../common/service/AService';
import { AccountUpdateValidator } from '../data/class-validator';
import {
  EVENT_CASTING_MAX_INTERVAL_MS,
  EEventName,
  MOCK_DATA_URL,
} from './constants';
import { ServiceStatusEvent } from '../data/service.dto';

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
 * @see {@link IEventSourceService}
 * @override {@link AService}
 */
@Injectable()
export class EventSourceServiceMock
  extends AService
  implements IEventSourceService
{
  /** A general events emitter to support the handling of new Account update Events */
  private eventEmitter: EventEmitter = new EventEmitter();

  /** Tracking of the last set timeout used to sequentially cast account update events, if any is active */
  private eventCastingTimeout: NodeJS.Timeout | undefined;

  /** URL of the JSON file to be fetched for populating a sample data set (mock) */
  private jsonMockFileUrl: string = MOCK_DATA_URL;

  /**
   * Set a new file URL as source of mock data
   * @param newStaticJsonFileUrl URL to the JSON file, e.g. `https://whatever.com/account-update-logs.json`
   */
  setJsonMockFileUrl(newStaticJsonFileUrl: string) {
    this.jsonMockFileUrl = newStaticJsonFileUrl;
  }

  /**
   * @see {@link IEventSourceService.registerListener}
   */
  registerListener<T>(
    eventName: EEventName,
    callback: { (data: T): Promise<void> },
    context?: any,
  ): void {
    this.eventEmitter.on(eventName, (data: T) => {
      callback.bind(context)(data);
    });
  }

  /**
   * Load a data set of Account Updates logs by fetching it from a provided JSON file URI.
   *
   * Convert the loaded objects into a list of `AccountEvent` and validate their consistency/support.
   *
   * @param staticJsonFileUrl File URL used for fetching its JSON content
   * @returns The list of loaded `AccountEvent` and their associated validation errors, if any
   */
  private async loadAccountEventsFromUrl(
    staticJsonFileUrl: string,
    validate: boolean | undefined = false,
  ) {
    // Fetch JSON
    const resp = await fetch(staticJsonFileUrl);
    if (!resp.ok) {
      throw new Error(
        `Failed to fetch Account Events mock data from '${staticJsonFileUrl}' HTTP error: ${resp.status}`,
      );
    }

    // Transform
    const jsonRaw = await resp.text();
    const eventLogs: AccountUpdateList = plainToInstance(
      AccountUpdateList,
      JSON.parse(`{"list":${jsonRaw}}`),
    );

    // Validate
    let validationErr: ValidationError[] = [];
    if (validate)
      validationErr = await AccountUpdateValidator.validateAll(eventLogs.list);

    return {
      events: eventLogs.list,
      validationErrors: validationErr,
    };
  }

  /**
   * Here we don't monitor an external data source of real-time events,
   * instead we load a static JSON data set of Account Updates and cast them
   * individually & sequentially for emulating an event casting system.
   *
   * @see {@link IEventSourceService.startMonitoringEvents}
   */
  async startMonitoringEvents(): Promise<void> {
    // Load the data sets of Account Events
    await this.loadAccountEventsFromUrl(this.jsonMockFileUrl)
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
      this.logger.warn(
        `Casting of Account Update Events is OVER - no more left`,
      );
      const statusEvt: ServiceStatusEvent = {
        source: this.constructor.name,
        active: false,
        leftover: 0,
      };
      this.eventEmitter.emit(EEventName.SERVICE_UPDATE, statusEvt);
      return;
    }

    // Generate a random number (integer) within the range [0; 1000]
    const timeoutMs = Math.floor(
      Math.random() * EVENT_CASTING_MAX_INTERVAL_MS + 1,
    );

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
  private emitAccountEvent(data: AccountUpdate): boolean {
    const result = this.eventEmitter.emit(EEventName.OC_ACCOUNT_UPDATE, data);
    if (!result)
      this.logger.warn(
        `No listeners found for events '${EEventName.OC_ACCOUNT_UPDATE}'`,
      );
    return result;
  }

  /**
   * Remove all listeners of the events emitter and stop casting new events
   */
  private stopEmittingEvents() {
    if (this.eventEmitter) this.eventEmitter.removeAllListeners();
    if (this.eventCastingTimeout) {
      clearTimeout(this.eventCastingTimeout);
      this.eventCastingTimeout = undefined;
    }
  }

  /**
   * @override {@link AService.shutdown}
   */
  shutdown(signal: string): void {
    this.stopEmittingEvents();
    super.shutdown(signal);
  }
}
