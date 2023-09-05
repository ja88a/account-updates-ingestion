# Sample processing of a JSon Data Stream

## Description

Purpose: Emulation of the indexing of data coming from a blockchain, e.g. account update events.

Solana account updates are considered, being streamed continuously in a real time system.

This project demonstrates possible data ingestion & handling techniques.


## Installation

```bash
$ pnpm install
```

## Running the app

```bash
# development
$ pnpm start

# watch mode
$ pnpm start:dev

# production mode
$ pnpm start:prod
```

## Test

```bash
# unit tests
$ pnpm test

# e2e tests
$ pnpm test:e2e

# test coverage
$ pnpm test:cov
```

## Tasks

### Features support

[ ] Create classes having appropriate encapsulation, attributes, and well deﬁned interfaces.

[ ] Account updates' data are read asynchronously from a json ﬁle (Vs. a live continuous data stream)

[ ] Each account comes into the system at a continuous uniform (random) distribution between 0 and 1000ms

[ ] Display a short message log message to console when each (accountId + version) tuple has been indexed.

[ ] Display a callback log when an account’s `call_back_time_ms` has expired. 

  [ ] If the same account is ingested with a newer version number, and the old callback has not ﬁred yet, cancel the older version’s active callback. 

  [ ] Display a message when an old callback is canceled in favor of a new one

  [ ] If an old version of the same account is ingested, ignore that update.

[ ] Once all events and callbacks have completed, print the highest token-value accounts by AccountType (taking into account write version), and gracefully shut-down the system.

### Project support

1. A README ﬁle that contains:
  * Instructions on how to run and test your code in a local environment through the
command line.
  * A description of how and why you chose the design patterns you did
  * A description of what observability you would add if this was a production system.
  What would you monitor for a production rollout?

2. Production-ready code that:
  * Follows community standard syntax and style
  * Has no debug logging, TODOs, or FIXMEs
  * Has test coverage to ensure quality and safety


## Info

### Data model

Accounts' sample data set:

```json
[{
  "id": "GzbXUY1JQwRVUf3j3myg2NbDRwD5i4jD4HJpYhVNfiDm",
  "accountType": "escrow",
  "tokens": 500000,
  "callbackTimeMs": 400,
  "data": {
    "subtype_field1": true,
    "subtype_field2": 999
  },
  "version": 123
}]
```

Each account has the following information:

`id` - Unique identiﬁer of the account

`accountType` - Type of the account.

`data` - Data of the account. All accounts that share the same AccountType have the same data schema. This is the information in which clients are most interested in. You can assume these schemas are ﬁxed.

`tokens` - Amount of tokens in the account.

`version` - Version of the account on chain. If two updates for the same account come in, the old
version should be erased.

`callbackTimeMs` - Time at which we’d like to print the contents of the account to console after it’s
been ingested.


### Example scenarios

These scenarios only cover a single accountID, but demonstrate the expected ingestion / callback behaviors:

#### Scenario 1 - Single Update

0ms - simulation starts - ID1 scheduled to be ingested 550ms (0-1000ms random) later

550ms - ID1 v1 is “ingested”, we print it as indexed

950ms - ID1 v1 callback ﬁres (and we log with version 1)

#### Scenario 2 - Updates with Cancellation

0ms - simulation starts - ID1 scheduled to be ingested 550ms (0-1000ms random) later

550ms - ID1 v1 is “ingested”, we print it as indexed

650ms - ID1 v3 is “ingested”, print ID1 v3 indexed, cancel active ID1 v1 callback

~~950ms - ID1 callback ﬁres (and we log with version 1)~~

1050ms - ID1 v3 callback ﬁres

## Supports

**[Nest](https://github.com/nestjs/nest)** is used as the progressive [Node.js](https://nodejs.org) framework for building efficient and scalable server-side applications.