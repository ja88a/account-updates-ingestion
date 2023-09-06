import { Test, TestingModule } from '@nestjs/testing';
import { AccountHandlerCallback } from './AccountHandlerCallback';

describe('AccountHandlerCallback', () => {
  let service: AccountHandlerCallback;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountHandlerCallback],
    }).compile();

    service = module.get<AccountHandlerCallback>(AccountHandlerCallback);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
