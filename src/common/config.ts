import { ValidatorOptions } from 'class-validator';

/**
 * Common set of settings relating to the Microservice configuration
 */
export const MS_CONFIG = {
  /**
   * The URI prefix behind which all HTTP API are exposed
   */
  URI_DOMAIN_API: 'api',

  /**
   * Actual URI version number(s) this microservice's controller supports
   * It can consists in an array, e.g. `['1', '2']` or be `VERSION_NEUTRAL`.
   * Refer to {@link https://docs.nestjs.com/techniques/versioning}
   */
  VERSION_PUBLIC: '1',

  /**
   * The public port number this Nodejs app exposes, where the controller API is accessible from
   */
  PORT_EXPOSED: 3000,

  /**
   * Specify if the server app should automatically shutdown by default, when the service gets inactive
   */
  EXIT_ON_STOP: false,

  /**
   * Publish or not (`false`) the OpenAPI REST API specifications
   */
  OPENAPI_PUBLISH: true,
};

/**
 * Set of constants specific to the logger's configuration
 */
export const LOGGER = {
  /**
   * Name of the directory where log files are reported
   */
  OUTPUT_DIR: 'logs/',

  /**
   * Log files name default time postfix
   */
  FILE_DATE_PATTERN: 'YYYY-MM-DD',

  /**
   * Pattern of the timestamp reported for log entries in the json files and in the console
   * Leave it empty `''` for the default ISO date format
   */
  TIMESTAMP_PATTERN: 'YYYY-MM-DD HH:mm:ss.SSS',
};

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
  PROD = 'production',
  DEV = 'dev',
  default = PROD,
}

/**
 * The list of app specific process exit signals, used when shutting down the app
 */

export enum EProcessExitSignal {
  DONE = 'DONE',
  INIT_FAIL = 'INIT_FAIL',
  LEFTOVER = 'LEFTOVER',
  SIGRPC = 'SIGRPC',
}

/**
 * Max duration expressed in milliseconds to wait for shutting down the app
 */
export const EXIT_MAX_WAIT_MS: number = 10_000;
