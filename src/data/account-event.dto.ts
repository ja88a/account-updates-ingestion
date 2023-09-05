import { MetadataScanner } from '@nestjs/core';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsDefined,
  IsOptional,
  ValidateNested,
  IsPositive,
  ArrayMaxSize,
  IsNumber,
  IsInt,
  ArrayMinSize,
  IsArray,
  Min,
  isEthereumAddress,
  IsEthereumAddress,
  MaxLength,
  MinLength,
  isDefined,
} from 'class-validator';


export enum AccountType {
  ACCOUNT = 'account',
  METADATA = 'metadata',
  MINT = 'mint',
  AUCTION = 'auction',
  AUCTION_DATA = 'auctionData',
  MASTER_EDITION = 'masterEdition',
  ESCROW = 'escrow'
}

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

export class AccountUpdate {
  @IsDefined()
  @MinLength(40)
  @MaxLength(50)
  id!: string;

  @IsDefined()
  @IsEnum(AccountType, { message: 'Unsupported Account Type' })
  accountType!: AccountType;

  @IsDefined()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsInt()
  @Min(0)
  tokens!: number;

  @IsDefined()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsInt()
  @Min(0)
  callbackTimeMs!: number;

  @IsDefined()
  data!: AccountUpdateData;

  @IsDefined()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsInt()
  @Min(0)
  version!: number;
}

export class AccountUpdateList {
  @IsDefined()
  @IsArray()
  @ValidateNested()
  @Type(() => AccountUpdate)
  list!: AccountUpdate[];
}

