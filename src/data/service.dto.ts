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
} from 'class-validator';

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
  id: string;

  /** Number of tokens */
  tokens: number;
}

/**
 * Functional data structure used to report a leaderboard
 * of tokens' top owners, per account type
 */
export class AccountTypeTokenOwners {
  /** Account type */
  type!: string;

  /** Sorted list of account per their owned token numbers */
  accounts: AccountToken[];
}

/**
 *
 */
export class AccountTimeRange {
  /** Unique ID of the account */
  @IsOptional()
  @IsAlphanumeric()
  @MinLength(40)
  @MaxLength(50)
  accountId: string | undefined;

  /** Range Start time, expressed in Ms */
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsInt()
  @Min(-1)
  from: number;

  /** Range End time, expressed in Ms */
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsInt()
  @Min(-1)
  until: number;
}
