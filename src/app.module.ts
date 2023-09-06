import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountHandlerCallback } from './event-handler/AccountHandlerCallback';
import { AccountHandlerTokenLeaders } from './event-handler/AccountHandlerTokenLeaders';
import { EventIngestorService } from './event-ingestor/EventIngestorService';
import { EventSourceServiceMock as EventSourceService } from './event-source/EventSourceServiceMock';

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
    EventIngestorService,
    AccountHandlerCallback,
    AccountHandlerTokenLeaders,
  ],
})
export class AppModule {}
