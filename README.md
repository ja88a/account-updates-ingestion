# Sample processing of a JSon Data Stream

Purpose: Emulation of the indexing of data coming from a blockchain. In
Solana account updates are considered, being streamed continuously in a real time system.

## Dev Tasks

[] Create classes having appropriate encapsulation, attributes, and well deﬁned interfaces.

[] Account updates' data are read asynchronously from a json ﬁle (Vs. a live continuous data stream)

[] Each account comes into the system at a continuous uniform (random) distribution between 0 and 1000ms

[] Display a short message log message to console when each (accountId + version) tuple has been indexed.

[] Display a callback log when an account’s `call_back_time_ms` has expired. 

    [] If the same account is ingested with a newer version number, and the old callback has not ﬁred yet, cancel the older version’s active callback. 

    [] Display a message when an old callback is canceled in favor of a new one

    [] If an old version of the same account is ingested, ignore that update.

[] Once all events and callbacks have completed, print the highest token-value accounts by AccountType (taking into account write version), and gracefully shut-down the system.


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

`ID` - Unique identiﬁer of the account

`AccountType` - Type of the account.

`Data` - Data of the account. All accounts that share the same AccountType have the same data schema. This is the information in which clients are most interested in. You can assume these schemas are ﬁxed.

`Tokens` - Amount of tokens in the account.

`Version` - Version of the account on chain. If two updates for the same account come in, the old
version should be erased.

`CallbackTimeMs` - Time at which we’d like to print the contents of the account to console after it’s
been ingested.


 
