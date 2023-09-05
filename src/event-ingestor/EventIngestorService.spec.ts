import { Test, TestingModule } from '@nestjs/testing';
import { EventIngestorService } from './EventIngestorService';

describe('EventIngestorService', () => {
  let service: EventIngestorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventIngestorService],
    }).compile();

    service = module.get<EventIngestorService>(EventIngestorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
