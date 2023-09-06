import { ValidatorOptions } from 'class-validator';

/** Specify if the server app should automatically shutdown by default, when the service gets inactive */
export const EXIT_ON_STOP = true;

/**
 * Imported Data Validation options
 */
export const VALID_OPT: ValidatorOptions = {
  skipMissingProperties: false,
  forbidUnknownValues: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  dismissDefaultMessages: false,
  validationError: {
    target: true,
    value: true,
  },
  stopAtFirstError: false,
};

/**
 * Supported run modes
 */
export enum EConfigRunMode {
  PROD = 'prod',
  DEV = 'dev',
  default = PROD,
}
