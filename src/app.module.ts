import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { EventSourceServiceMock as EventSourceService } from './event-source/EventSourceServiceMock';
import { EventIngestorService } from './event-ingestor/EventIngestorService';
import { EventHandlerService } from './event-handler/EventHandlerService';
import { join } from 'path';

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
    EventHandlerService,
  ],
})
export class AppModule {}
