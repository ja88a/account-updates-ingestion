import { Injectable } from '@nestjs/common';
import { AccountUpdate } from '../data/account-event.dto';
import Logger from '../utils/logger';
import { IService } from '../common/IService';

@Injectable()
export class EventIngestorService implements IService {
  /** Logger */
  private readonly logger = Logger.child({
    label: EventIngestorService.name,
  });

  async handleAccountUpdateEvent(accountEvent: AccountUpdate) {
    this.logger.info(
      `Ingesting new Account Update event '${accountEvent.id}' v${accountEvent.version}`,
    );
  }

  init(): boolean {
    this.logger.info('Initializing the service');
    return true;
  }

  shutdown(signal: string): void {
    this.logger.info(`Shutting down the service on signal ${signal}`);
  }
}
