import { ServeStaticModule } from '@nestjs/serve-static';
import { Test, TestingModule } from '@nestjs/testing';
import { join } from 'path';
import { AccountIngestorController } from './ingestor.controller';
import { AccountIngestorService } from './ingestor.service';
import { AccountHandlerCallback } from './event-handler/AccountHandlerCallback';
import { AccountHandlerTokenLeaders } from './event-handler/AccountHandlerTokenLeaders';
import { AccountUpdateIngestor } from './event-ingestor/AccountUpdateIngestor';
import { EventSourceServiceMock } from './event-source/EventSourceServiceMock';
import { EAccountType } from './data/account-update.dto';

describe('AppController', () => {
  let appController: AccountIngestorController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ServeStaticModule.forRoot({
          rootPath: join(__dirname, '..', 'static'),
        }),
      ],
      controllers: [AccountIngestorController],
      providers: [
        AccountIngestorService,
        EventSourceServiceMock,
        AccountUpdateIngestor,
        AccountHandlerCallback,
        AccountHandlerTokenLeaders,
      ],
    }).compile();

    appController = app.get<AccountIngestorController>(
      AccountIngestorController,
    );
  });

  describe('Getting the Service Ping', () => {
    it('should return "true"', () => {
      expect(appController.getPing()).toBe<boolean>(true);
    });
  });

  describe('Getting the Service Status', () => {
    it('should return a JSON data set', () => {
      const appStatusReport = appController.getStatus();
      expect(appStatusReport.accounts).toBeDefined();
      expect(appStatusReport.maxtokens).toBeDefined();
      expect(appStatusReport.maxtokens.history).toBeDefined();
      expect(appStatusReport.maxtokens.leaderboard).toBeDefined();
      expect(appStatusReport.pending).toBeDefined();
    });
  });

  describe('Getting the Leaderboard report', () => {
    it('should return an empty Object', () => {
      const leaderboardReport = appController.getLeaderboard();
      expect(leaderboardReport).toBeDefined();
      expect(leaderboardReport[EAccountType.ACCOUNT]).toBeUndefined();
    });
  });

  describe('Iniating the app module', () => {
    it('should init all services smoothly', () => {
      appController.onModuleInit().catch((error) => {
        fail('No error on module init is expected but: ' + error);
      });
    });
  });
});
