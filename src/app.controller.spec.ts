import { ServeStaticModule } from '@nestjs/serve-static';
import { Test, TestingModule } from '@nestjs/testing';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountHandlerCallback } from './event-handler/AccountHandlerCallback';
import { AccountHandlerTokenLeaders } from './event-handler/AccountHandlerTokenLeaders';
import { EventIngestorService } from './event-ingestor/EventIngestorService';
import { EventSourceServiceMock } from './event-source/EventSourceServiceMock';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ServeStaticModule.forRoot({
          rootPath: join(__dirname, '..', 'static'),
        }),
      ],
      controllers: [AppController],
      providers: [
        AppService,
        EventSourceServiceMock,
        EventIngestorService,
        AccountHandlerCallback,
        AccountHandlerTokenLeaders,
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('/ping', () => {
    it('should return "true"', () => {
      expect(appController.getPing()).toBe<boolean>(true);
    });
  });
});
