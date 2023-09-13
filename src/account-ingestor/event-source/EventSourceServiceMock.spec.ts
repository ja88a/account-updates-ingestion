import { Test, TestingModule } from '@nestjs/testing';
import { EventSourceServiceMock } from './EventSourceServiceMock';

describe('EventSourceServiceMock', () => {
  let service: EventSourceServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventSourceServiceMock],
    }).compile();

    service = module.get<EventSourceServiceMock>(EventSourceServiceMock);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
