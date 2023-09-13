import { Type } from 'class-transformer';
import {
  IsDefined,
  MinLength,
  MaxLength,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsAlphanumeric,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  IsString,
} from 'class-validator';
import { LEADERBOARD_LIST_SIZE } from '../event-handler/constants';

/**
 * Event structure for communicating about a service status
 */
export class ServiceStatusEvent {
  /** Service ID (class name) the event is about */
  @IsDefined()
  @MinLength(3)
  @MaxLength(20)
  source!: string;

  /** Is the service still active */
  @IsDefined()
  @IsBoolean()
  active: boolean = true;

  /** Actions or items left over, still to be processed */
  @IsOptional()
  @IsNumber()
  leftover?: number = 0;
}

/**
 * Functional data structure to collect accounts and their
 * number of associated tokens
 */
export class AccountToken {
  /** Account ID */
  @IsDefined()
  @IsAlphanumeric()
  @MinLength(40)
  @MaxLength(50)
  id: string;

  /** Number of tokens */
  tokens: number;
}

/**
 * Functional data structure used to report a list
 * of tokens' owners, for a given account type
 */
export class AccountTypeTokenOwners {
  /** Account type */
  @IsDefined()
  @IsString()
  @MaxLength(40)
  type!: string;

  /** Sorted list of account per their owned token numbers */
  @IsDefined()
  @IsArray()
  @MaxLength(LEADERBOARD_LIST_SIZE)
  @ValidateNested()
  @Type(() => AccountToken)
  accounts: AccountToken[];
}

export class AccountTime {
  /** Unique ID of the account */
  @IsOptional()
  @IsAlphanumeric()
  @MinLength(40)
  @MaxLength(50)
  accountId: string | undefined;

  /** Start time, expressed in Ms */
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsInt()
  @Min(-1)
  from: number;
}

/**
 *
 */
export class AccountTimeRange extends AccountTime {
  /** Range End time, expressed in Ms */
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsInt()
  @Min(-1)
  until: number;
}

/**
 * The history of the max token owners over time, per account type
 */
export class AccountTypeTopTokenOwnerHistory {
  /** Account type */
  type: string;

  /** List of the account top owners over time */
  history: AccountTime[];
}
