import { ValidationError, validate } from 'class-validator';
import { VALID_OPT } from '../../common/config';
import { AccountUpdate } from './account-update.dto';
import Logger from '../../common/logger';

export class AccountUpdateValidator {
  /** Logger */
  private static logger = Logger.child({
    label: AccountUpdateValidator.name,
  });

  /**
   * Validate a account update event and provide fields & values validation errors if any
   * @param eventLog the account update event to validate
   * @return List of validation errors, if any. Else an empty array.
   */
  static async validate(eventLog: AccountUpdate): Promise<ValidationError[]> {
    const validationErr: ValidationError[] = await validate(
      eventLog,
      VALID_OPT,
    ).catch((error) => {
      throw new Error(
        `Failed to validate the account update event ${eventLog.id} ${eventLog.accountType} v${eventLog.version} \n${error}`,
      );
    });

    if (validationErr.length > 0) {
      AccountUpdateValidator.logger.warn(
        `Validation of event ${eventLog.id} ${eventLog.accountType} ${eventLog.version} results in ${validationErr.length} issue(s) \n${validationErr}`,
      );
    }
    return validationErr;
  }

  /**
   * Validate a list of logged onchain events (fields & values validation issues)
   * @param eventLogs the list of account events to validate
   * @return List of validation errors, if any. Else an empty array.
   */
  static async validateAll(
    eventLogs: AccountUpdate[],
  ): Promise<ValidationError[]> {
    let validationErr: ValidationError[] = [];
    for (let i = 0; i < eventLogs.length; i++) {
      await this.validate(eventLogs[i])
        .then((validErr) => {
          validationErr = validationErr.concat(validErr);
        })
        .catch((error) => {
          throw new Error(
            `Batch validation of ${eventLogs.length} account update events aborted at index ${i} \n${error}`,
          );
        });
    }

    if (validationErr.length > 0) {
      AccountUpdateValidator.logger.warn(
        `Validation of ${eventLogs.length} events resulted in ${validationErr.length} issue(s)`,
      );
    }
    return validationErr;
  }
}
