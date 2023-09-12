import {
  EConfigRunMode,
  MICROSERVICE_VERSION_PUBLIC,
  VALID_OPT,
} from './config';

describe('App Config', () => {
  it('Class Validator Options', () => {
    expect(VALID_OPT).toBeDefined();

    expect(VALID_OPT.forbidUnknownValues).toBe(true);
    expect(VALID_OPT.whitelist).toBe(true);
    expect(VALID_OPT.forbidNonWhitelisted).toBe(true);
    expect(VALID_OPT.skipMissingProperties).toBe(false);

    if (process.env.NODE_ENV == EConfigRunMode.PROD) {
      expect(VALID_OPT.stopAtFirstError).toBe(true);
    }
  });

  it('Service API Version', () => {
    expect(MICROSERVICE_VERSION_PUBLIC).toBeDefined();

    if (process.env.NODE_ENV == EConfigRunMode.PROD) {
      expect(MICROSERVICE_VERSION_PUBLIC).toBe('1');
    }
  });
});
