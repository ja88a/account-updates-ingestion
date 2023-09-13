import { Injectable } from '@nestjs/common';
import { IEventHandlerService } from './IEventHandlerService';
import AService from '../common/service/AService';
import { AccountUpdate, EAccountType } from '../data/account-update.dto';
import {
  AccountTimeRange,
  AccountToken,
  AccountTypeTokenOwners,
} from '../data/service.dto';
import { searchInsert } from '../utils';

/** Max number of leaders (account with max tokens) to keep track of, per account type */
const LEADERBOARD_SIZE = 3;
const LEADERBOARD_SIZE_BUFFER = 2;

const TOP_OWNERS_HISTORY_MAX_SIZE = 200;

/**
 * Manages a leaderboard of updated accounts having the max number of tokens,
 * per account type: user account, auction, escrow, etc
 */
@Injectable()
export class AccountHandlerTokenLeaders
  extends AService
  implements IEventHandlerService
{
  /** Keep track of accounts' ID and their number of tokens, grouped by account type */
  private maxTokenOwners: Map<string, AccountToken[]> = new Map();

  /** Keep track of the max tokens' account over time, per account type */
  private topOwnerOverTime: Map<
    string,
    { accountId: string; startTime: number }[]
  > = new Map();

  /**
   * Manages the list of accounts representing the top token holders (known ones)
   * for a given account type.
   * @param accountUpd the new Account Update to process
   * @returns Report if the Account Update lead to an update of the leaderboard (`true`)
   */
  async processAccountUpdate(accountUpd: AccountUpdate): Promise<boolean> {
    // Check inputs
    const issues = await this.validateAccountUpdate(accountUpd);
    if (issues.length > 0) {
      this.logger.warn(
        `Ignoring ${accountUpd.id} v${accountUpd.version} - Not processing`,
      );
      return false;
    }

    const accountId = accountUpd.id;
    const accountType = accountUpd.accountType;
    const accountNbTokens = accountUpd.tokens;
    let recorded = false;

    /// See if the account is eligible for being part of the max token owners' Leaderboard

    let accountTypeLeaders = this.maxTokenOwners.get(accountType);

    if (accountTypeLeaders == undefined) {
      // Init the account type entry
      accountTypeLeaders = [];
      this.maxTokenOwners.set(accountType, accountTypeLeaders);
    } else {
      // Check if not already part of the leaderboard, if so, update it
      for (let i = 0; i < accountTypeLeaders.length; i++) {
        const entry = accountTypeLeaders[i];
        if (accountId == entry.id) {
          entry.tokens = accountNbTokens;
          recorded = true;
          break;
        }
      }
    }

    if (!recorded) {
      if (
        accountTypeLeaders.length <
        LEADERBOARD_SIZE + LEADERBOARD_SIZE_BUFFER
      ) {
        // First entries, free room left
        this.insertLeader(
          { id: accountId, tokens: accountNbTokens },
          accountTypeLeaders,
        );
        recorded = true;
      } else {
        // The account owns more tokens than current last top owner
        const lastRunner = accountTypeLeaders[accountTypeLeaders.length - 1];
        if (accountUpd.tokens > lastRunner.tokens) {
          accountTypeLeaders = this.insertLeader(
            { id: accountId, tokens: accountNbTokens },
            accountTypeLeaders,
          );
          recorded = true;
        }
      }
    }

    if (recorded) {
      // Sort the list of tokens' top owners (descending order)
      accountTypeLeaders.sort((a, b) =>
        a.tokens < b.tokens ? 1 : a.tokens > b.tokens ? -1 : 0,
      );

      /// Track if it deals with the new top owner, if so record it

      const topAccountId = accountTypeLeaders[0].id;
      let topOwnerHistory = this.topOwnerOverTime.get(accountType);

      let lastTopOwner: string | undefined = undefined;
      if (topOwnerHistory == undefined) topOwnerHistory = [];
      else lastTopOwner = topOwnerHistory[topOwnerHistory.length - 1].accountId;

      if (lastTopOwner !== topAccountId) {
        // Append at the end the new top owner entry
        topOwnerHistory.push({
          accountId: topAccountId,
          startTime: new Date().getMilliseconds(),
        });

        // Limit the Map size
        if (topOwnerHistory.length > TOP_OWNERS_HISTORY_MAX_SIZE)
          topOwnerHistory.pop();
      }
    }

    return recorded;
  }

  /**
   * Retrieve which account was the top tokens' owner at a given time, for a specific account type
   *
   * @param accountType The type of account
   * @param timeMs The time expressed using the Unix timestamp format (epoch, Ms)
   * @returns ID the account, if found, and corresponding top owner's time period
   */
  retrieveTopOwnerAtTime(
    accountType: EAccountType,
    timeMs: number,
  ): AccountTimeRange {
    let accountId = undefined;
    let from = -1;
    let until = -1;

    const topOwnerHistory = this.topOwnerOverTime.get(accountType);
    if (topOwnerHistory) {
      // Prepare
      const startTimes: number[] = [];
      topOwnerHistory.forEach((entry) => {
        startTimes.push(entry.startTime);
      });

      // Search
      const index = searchInsert(startTimes, timeMs);
      if (index > 0) {
        // Extract the info
        accountId = topOwnerHistory[index].accountId;
        from = topOwnerHistory[index].startTime;
        if (index < startTimes.length - 1)
          until = topOwnerHistory[index + 1].startTime;
      }
    }
    return {
      accountId: accountId,
      from: from,
      until: until,
    };
  }

  /**
   * Insert a new entry in the leaderboard: push new record, descending sorting, maintain array max length
   * @param accountToken
   * @param accountTypeLeaders
   * @returns
   */
  private insertLeader(
    accountToken: AccountToken,
    accountTypeLeaders: AccountToken[],
  ): AccountToken[] {
    accountTypeLeaders.push(accountToken);
    accountTypeLeaders.sort((a, b) =>
      a.tokens < b.tokens ? 1 : a.tokens > b.tokens ? -1 : 0,
    );
    if (accountTypeLeaders.length > LEADERBOARD_SIZE + LEADERBOARD_SIZE_BUFFER)
      accountTypeLeaders.pop();
    return accountTypeLeaders;
  }

  /**
   * Generate a leaderboard report about the accounts having the highest number of tokens
   * @returns `{ [accountTypeName]: Array<{id: string, tokens: number}> }` with the array entries sorted per the number of hold tokens
   */
  reportLeaderboard(): any {
    const accountTypeTokenTopOwners = {};
    for (const entry of this.maxTokenOwners.entries()) {
      Object.assign(accountTypeTokenTopOwners, {
        [entry[0]]: entry[1],
      });
    }
    return accountTypeTokenTopOwners;
  }

  /**
   * Generate a report about the accounts having the highest number of tokens
   * @returns A list of accounts owning the max number of tokens, for each registered account type
   */
  reportStatus(): AccountTypeTokenOwners[] {
    const accountTypeTokenTopOwners: AccountTypeTokenOwners[] = [];
    for (const entry of this.maxTokenOwners.entries()) {
      const newEntry = {
        type: entry[0],
        accounts: entry[1],
      };
      accountTypeTokenTopOwners.push(newEntry);
    }
    return accountTypeTokenTopOwners;
  }

  /**
   * @override {@link AService.shutdown}
   */
  shutdown(signal: string): void {
    this.maxTokenOwners.clear();
    this.topOwnerOverTime.clear();
    super.shutdown(signal);
  }
}
