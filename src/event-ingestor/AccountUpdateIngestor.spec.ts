import { Test, TestingModule } from '@nestjs/testing';
import { AccountUpdateIngestor } from './AccountUpdateIngestor';

describe('AccountUpdateIngestor', () => {
  let service: AccountUpdateIngestor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountUpdateIngestor],
    }).compile();

    service = module.get<AccountUpdateIngestor>(AccountUpdateIngestor);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
