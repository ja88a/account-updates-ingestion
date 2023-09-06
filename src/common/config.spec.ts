import { EConfigRunMode, VALID_OPT } from './config';

describe('App Config', () => {
  it('Class Validator Options', () => {
    expect(VALID_OPT).toBeDefined();

    expect(VALID_OPT.forbidUnknownValues).toBe(true);
    expect(VALID_OPT.whitelist).toBe(true);
    expect(VALID_OPT.forbidNonWhitelisted).toBe(true);

    if (process.env.NODE_ENV == EConfigRunMode.PROD) {
      expect(VALID_OPT.stopAtFirstError).toBe(true);
    }
  });
});
