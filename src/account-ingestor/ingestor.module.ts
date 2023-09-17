import { Module } from '@nestjs/common';
import { AccountIngestorController } from './ingestor.controller';
import { AccountIngestorService } from './ingestor.service';
import { AccountHandlerCallback } from './event-handler/AccountHandlerCallback';
import { AccountHandlerTokenLeaders } from './event-handler/AccountHandlerTokenLeaders';
import { AccountUpdateIngestor } from './event-ingestor/AccountUpdateIngestor';
import { EventSourceServiceMock as EventSourceService } from './event-source/EventSourceServiceMock';

/**
 * The Server Application main module.
 *
 * Enable binding internal & external modules and services
 */
@Module({
  imports: [],
  controllers: [AccountIngestorController],
  providers: [
    AccountIngestorService,
    EventSourceService,
    AccountUpdateIngestor,
    AccountHandlerCallback,
    AccountHandlerTokenLeaders,
  ],
  exports: [AccountIngestorService],
})
export class AccountIngestorModule {}
