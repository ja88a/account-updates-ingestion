import { createLogger, format, transports } from 'winston';
import { EConfigRunMode } from '../common/config';

/**
 * WinstonJS Logger integration
 *
 * Refer to [winstonjs/winston](https://github.com/winstonjs/winston)
 */
const logger = createLogger({
  level: 'info',
  format: format.json(),
  defaultMeta: { service: 'onchain-events-ingestor' },
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log', level: 'info' }),
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
    }),
  );
}

export default logger;
