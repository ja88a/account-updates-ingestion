import { createLogger, format, transports } from 'winston';

import 'winston-daily-rotate-file';
import { DailyRotateFile } from 'winston/lib/winston/transports';

import { EConfigRunMode, LOGS_DIR } from '../common/config';

/**
 * WinstonJS Logger integration
 *
 * Refer to [winstonjs/winston](https://github.com/winstonjs/winston)
 *
 * Integrates an automatic Daily File Rotation for local log files and a retention policy over time
 */
const logger = createLogger({
  level: 'info',
  exitOnError: true, // Default is `true` for not interfering
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS',
    }),
    format.json(),
  ),

  defaultMeta: { service: 'onchain-events-ingestor' },
  transports: [
    // - Write all logs with importance level of `error` or less to `error.log`
    new DailyRotateFile({
      filename: LOGS_DIR + 'error-%DATE%.log',
      level: 'error',
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '10d',
    }),
    // - Write all logs with importance level of `info` or less to `combined.log`
    new DailyRotateFile({
      filename: LOGS_DIR + 'combined-%DATE%.log',
      level: 'info',
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '50m',
      maxFiles: '5d',
    }),
    // // AWS CloudWatch connector -> requires `winston-aws-cloudwatch`
    // new CloudWatchLogsTransport({
    //   logGroupName: 'my-log-group',
    //   logStreamName: 'my-log-stream',
    //   awsAccessKeyId: 'my-access-key-id',
    //   awsSecretKey: 'my-secret-key',
    //   awsRegion: 'us-east-1'
    // }),
  ],
  exceptionHandlers: [
    //new transports.File({ filename: LOGS_DIR + 'exceptions.log' }),
    new DailyRotateFile({
      filename: LOGS_DIR + 'exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '31d',
    }),
  ],
});

//
// If we're not in production mode then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== EConfigRunMode.PROD) {
  const consoleFormat = format.printf(
    ({ timestamp, label, level, message }) => {
      return `${timestamp} [${label}]\t${level}: ${message}`;
    },
  );

  const alignedWithColorsAndTime = format.combine(
    format.colorize({ all: true }),
    format.timestamp({ format: 'MM-DD HH:mm:ss.SSS' }),
    consoleFormat,
  );

  logger.add(
    new transports.Console({
      level: 'info',
      format: alignedWithColorsAndTime,
      handleExceptions: true,
    }),
  );
}

export default logger;
