import { Injectable } from '@nestjs/common';
import { IEventHandlerService } from './IEventHandlerService';
import AService from '../common/service/AService';
import { AccountUpdate } from '../data/account-update.dto';
import { AccountToken, AccountTypeTokenOwners } from '../data/service.dto';

/** Max number of leaders (account with max tokens) to keep track of, per account type */
const LEADERBOARD_SIZE = 3;
const LEADERBOARD_SIZE_BUFFER = 2;

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
  private accountTypeAccountToken: Map<string, AccountToken[]> = new Map();

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
      this.logger.warn(`Ignoring ${accountUpd.id} v${accountUpd.version} - Not processing`);
      return false;
    }

    const accountId = accountUpd.id;
    const accountType = accountUpd.accountType;
    const accountTokens = accountUpd.tokens;
    let recorded = false;
    let accountTypeLeaders = this.accountTypeAccountToken.get(accountType);

    if (accountTypeLeaders == undefined) {
      accountTypeLeaders = [];
      this.accountTypeAccountToken.set(accountType, accountTypeLeaders);
    } else {
      // Check if not already part of the leaderboard, if so, update it
      for (let i = 0; i < accountTypeLeaders.length; i++) {
        let entry = accountTypeLeaders[i];
        if (accountId == entry.id) {
          entry.tokens = accountTokens;
          recorded = true;
          break;
        }
      }
      // Sort & exit
      if (recorded) {
        accountTypeLeaders.sort((a, b) =>
          a.tokens < b.tokens ? 1 : a.tokens > b.tokens ? -1 : 0,
        );
        return true;
      }
    }

    // Lack of particpants
    if (accountTypeLeaders.length < LEADERBOARD_SIZE + LEADERBOARD_SIZE_BUFFER) {
      this.insertLeader(
        { id: accountId, tokens: accountTokens },
        accountTypeLeaders,
      );
      recorded = true;
    } else {
      // Has more than current last top leader
      const lastRunner = accountTypeLeaders[accountTypeLeaders.length - 1];
      if (accountUpd.tokens > lastRunner.tokens) {
        accountTypeLeaders = this.insertLeader(
          { id: accountId, tokens: accountTokens },
          accountTypeLeaders,
        );
        recorded = true;
      }
    }

    return recorded;
  }

  /**
   * Insert a new entry in the leaderboard: push new record, descending sorting, maintain array max length
   * @param accountToken 
   * @param accountTypeLeaders 
   * @returns 
   */
  insertLeader(
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
    let accountTypeTokenTopOwners = {};
    for (let entry of this.accountTypeAccountToken.entries()) {
      Object.assign(accountTypeTokenTopOwners, {
        [entry[0]]: entry[1],
      });
    }
    return accountTypeTokenTopOwners;
  }

  /**
   * Generate a report about the accounts having the highest number of tokens
   * @returns `Array<{ type: string, accounts: Array<{id: string, tokens: number}> }>`
   */
  reportStatus(): AccountTypeTokenOwners[] {
    let accountTypeTokenTopOwners: AccountTypeTokenOwners[] = [];
    for (let entry of this.accountTypeAccountToken.entries()) {
      const newEntry = {
        type: entry[0],
        accounts: entry[1]
      }
      accountTypeTokenTopOwners.push(newEntry);
    }
    return accountTypeTokenTopOwners
  }

  /**
   * @override {@link AService.shutdown}
   */
  shutdown(signal: string): void {
    this.accountTypeAccountToken.clear();
    super.shutdown(signal);
  }
}
