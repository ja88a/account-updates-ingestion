import { Test, TestingModule } from '@nestjs/testing';
import { AccountHandlerCallback } from './AccountHandlerCallback';
import { EAccountType, AccountUpdate } from '../data/account-update.dto';

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

  it('should init', () => {
    expect(service.init()).toBe(true);
  });

  it('should report a status', () => {
    expect(service.reportStatus()).toBeDefined();
  });

  const validAccountUpd: AccountUpdate = {
    id: '6BhkGCMVMyrjEEkrASJcLxfAvoW43g6BubxjpeUyZFoz',
    accountType: EAccountType.ACCOUNT,
    tokens: 100,
    callbackTimeMs: 1000,
    data: {
      mintId: '6BhkGCMVMyrjEEkrASJcLxfAvoW43g6BubxjpeUyZFoz',
    },
    version: 77,
  };

  const invalidAccountUpdId: AccountUpdate = {
    id: '',
    accountType: EAccountType.ACCOUNT,
    tokens: 100,
    callbackTimeMs: 1000,
    data: {
      mintId: '6BhkGCMVMyrjEEkrASJcLxfAvoW43g6BubxjpeUyZFoz',
    },
    version: 66,
  };

  // it('should report no validation issue', () => {
  //   expect(service.validateAccountUpdate(validAccountUpd)).toBe(true);
  // });

  it('should report a positive handling', () => {
    expect(
      service.processAccountUpdate(validAccountUpd).then((result) => {
        return result;
      }),
    ).toBeTruthy();
  });

  it('should not be processed', () => {
    expect(
      service.processAccountUpdate(invalidAccountUpdId),
    ).resolves.toBeFalsy();
  });
});
