import { Type } from 'class-transformer';
import {
  IsAlphanumeric,
  IsArray,
  IsDefined,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Supported Account Types */
export enum EAccountType {
  ACCOUNT = 'account',
  METADATA = 'metadata',
  MINT = 'mint',
  AUCTION = 'auction',
  AUCTION_DATA = 'auctionData',
  MASTER_EDITION = 'masterEdition',
  ESCROW = 'escrow',
}

/**
 * Data of Account Updates
 */
export class AccountUpdateData {
  @IsOptional()
  @MaxLength(256)
  @MinLength(6)
  img?: string;

  @IsOptional()
  @MaxLength(256)
  @MinLength(1)
  mintId?: string;

  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsInt()
  @Min(-1)
  expiry?: number;

  @IsOptional()
  @IsNumber()
  currentBid?: number;
}

/**
 * Account Update logged event
 */
export class AccountUpdate {
  /** Data model version number */
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsInt()
  @Min(0)
  _version?: number = 1;

  /** Unique identiﬁer of the account */
  @IsDefined()
  @IsAlphanumeric()
  @MinLength(40)
  @MaxLength(50)
  id!: string;

  /** Type of the account */
  @IsDefined()
  @IsEnum(EAccountType, { message: 'Unknown Account Type' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  accountType!: EAccountType;

  /** Amount of tokens in the account */
  @IsDefined()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsInt()
  @Min(0)
  tokens!: number;

  /** Time after which the contents of the account is logged after it’s been ingested */
  @IsDefined()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsInt()
  @Min(0)
  callbackTimeMs!: number;

  /** Data of the account */
  @IsDefined()
  @Type(() => AccountUpdateData)
  data!: AccountUpdateData;

  /** Version of the account on chain */
  @IsDefined()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsInt()
  @Min(0)
  version!: number;
}

/**
 * Utility structure to enable the validation of a raw JSON array
 * of logged account updates
 */
export class AccountUpdateList {
  @IsDefined()
  @IsArray()
  @ValidateNested()
  @Type(() => AccountUpdate)
  list!: AccountUpdate[];
}
