import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './account-ingestor/app.controller';
import { AppService } from './account-ingestor/app.service';
import { AccountHandlerCallback } from './account-ingestor/event-handler/AccountHandlerCallback';
import { AccountHandlerTokenLeaders } from './account-ingestor/event-handler/AccountHandlerTokenLeaders';
import { AccountUpdateIngestor } from './account-ingestor/event-ingestor/AccountUpdateIngestor';
import { EventSourceServiceMock as EventSourceService } from './account-ingestor/event-source/EventSourceServiceMock';

/**
 * The Server Application main module.
 *
 * Enable binding internal & external modules and services
 */
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'static'),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EventSourceService,
    AccountUpdateIngestor,
    AccountHandlerCallback,
    AccountHandlerTokenLeaders,
  ],
})
export class AppModule {}
