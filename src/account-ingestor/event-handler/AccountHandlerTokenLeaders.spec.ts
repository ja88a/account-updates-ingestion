import { Test, TestingModule } from '@nestjs/testing';
import { AccountHandlerTokenLeaders } from './AccountHandlerTokenLeaders';

describe('AccountHandlerTokenLeaders', () => {
  let service: AccountHandlerTokenLeaders;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountHandlerTokenLeaders],
    }).compile();

    service = module.get<AccountHandlerTokenLeaders>(
      AccountHandlerTokenLeaders,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
