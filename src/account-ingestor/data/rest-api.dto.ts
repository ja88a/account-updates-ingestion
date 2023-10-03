import { Type } from 'class-transformer';
import { IsDefined, IsArray, ValidateNested } from 'class-validator';
import { AccountUpdate } from './account-update.dto';
import {
  AccountHandlerCallbackStatus,
  AccountTypeTokenOwners,
  AccountTypeTopTokenOwnerHistory,
} from './service.dto';

export class StatusMaxTokens {
  /** Actual leaderboard of accounts hodling the most tokes, per account type */
  @IsDefined()
  @IsArray()
  @ValidateNested()
  @Type(() => AccountTypeTokenOwners)
  leaderboard: AccountTypeTokenOwners[];

  /** Actual history of max tokens hodler for each account type */
  @IsDefined()
  @IsArray()
  @ValidateNested()
  @Type(() => AccountTypeTopTokenOwnerHistory)
  history: AccountTypeTopTokenOwnerHistory[];
}

/**
 * The JSON output for reporting about actual states of the application services
 */
export class OutputAppStates {
  /** List of actual indexed Accounts with their last update */
  @IsDefined()
  @IsArray()
  @ValidateNested()
  @Type(() => AccountUpdate)
  accounts!: AccountUpdate[];

  /** Data set about accounts owning actual maximum of tokens */
  @IsDefined()
  maxtokens: StatusMaxTokens;

  /** Actions or items left over, still to be processed */
  @IsDefined()
  @Type(() => AccountUpdate)
  pending!: AccountHandlerCallbackStatus;
}
