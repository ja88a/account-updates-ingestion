# Sample processing of a JSon Data Stream

## Description

Purpose: Emulation of the indexing of data coming from a blockchain, e.g. account update events.

Solana account updates are considered, being streamed continuously in a real time system. In the context of this project, the casting of logged account updates is
emulated: a static JSON file is loaded (made of +100 entries) and their cast is made sequentially, based on a random time interval.

This project demonstrates possible techniques for ingesting data & handling their further processing.

## Tech requirements

The `pnpm` packet manager for Node.js is used, however it can be replaced by `yarn`.

You can install `pnpm` using:
```bash
$ npm install --global pnpm
```

This project has been developped using Node.js LTS version `18.17`.

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

# End-to-end tests
$ pnpm test:e2e
```

## Architecture
### Key drivers

While this is a demo application, the design of this app meets the following fundamentals:
  * The service must be **evolutive**: modularity (add/remove/replace internal services without impacting other); strict minimal dependencies among components; communications through internal generic interfaces, or events
  * The service must be **scalable**: support for vertical & horizontal scaling; low CPU & memory footprint; high throuput & low response time; extensive usage of async supports and concurrency considerations
  * The service must be **secure**: low network exposure; systematic external inputs validation; lowest trust even among internal services

Actual system has been divided into 3 main business area (and corresponding service types):
1. Handling the external source of data events
2. Ingestion of the information, account updates here (logged onchain events), for their indexing, validation/filtering, transformation, persistence management, etc and moreover enabling their further processing by specifc handlers
3. Handling specific processing of ingested events: triggering further handling per the event type, tracking and managing statistics, etc

### Modules & Services

![Architecture diagram overview](./static/diag/arch-overview_diag01w.png)

One main application module has been considered on top of 3 main types of services:

1. **Application Controller**: Responsible for the application lifecycle and managing the main services composition and runtime.
    * Init, start, stop & graceful shutdown management
    * Binding the services together by registering services or callbacks among each other
    * Exposing a REST API for reporting the application status and service info to remote clients

    Application Controller implementation: [app.controller.ts](./src/app.controller.ts)

2. Service **Data Source Handler**: An adaptor responsible for monitoring (pulling/listening) an external source of events, validating these inputs and reporting them internally for their ingestion by the system.
    
    It can consist in a client listening to a message queuing system, or polling a DB or API (REST http / RPC).

    Service interface: [IEventSourceService](./src/event-source/IEventSourceService.ts)

    The implemented event casting emulator fetch (http GET) a JSON file, transform and validate the account update events using a Code-as-Schema approach where the fields & values are constrained. Then the entries are scheduled to be sequentially cast through an event emitter channel, to which events listener services can subscribe their callback method to further process the data.

    For the events sourcing emulator, refer to [EventSourceServiceMock](./src/event-source/EventSourceServiceMock.ts)

3. Service **Events Ingestor**: A service registering its event-specific callback(s) to a data source handler to ingest imported events data.

    Actual implementation has an handler specific to events of type 'account updates', emitted by the data source handler, in order to ingest them.

    Events data are validated, ignored if considered as invalid (missing or unknown field or value) and then indexed in memory, while a remote persistent storage might be considered. Once an account update is ingested, the registered handlers for account updates have their dedicated callback triggered.

    Service interface: [IEventIngestorService](./src/event-ingestor/IEventIngestorService.ts)

    Account Update Ingestor implementation: refer to [AccountUpdateIngestor](./src/event-ingestor/AccountUpdateIngestor.ts)

4. Service **Events Handler**: Services responsible for performing specific handling of ingested event, per their type & info.

    The event handler services are registered to a given events ingestor service in order for their async processing to be triggered on the ingestion of new events.

    2 implementations of this service type are available:
    * one dedicated to triggering callbacks, which expiration time is expressed by the Account Update events
    * another is dedicated to maintaining a minimum leaderboard of the accounts owning the most tokens, grouped per account types

    Service interface: [IEventHandlerService](./src/event-handler/IEventHandlerService.ts)
    
    Account Update Handler for Callbacks: [AccountHandlerCallback](./src/event-handler/AccountHandlerCallback.ts)
        
    Account Update Handler for tracking accounts' tokens holding: [AccountHandlerTokenLeaders](./src/event-handler/AccountHandlerTokenLeaders.ts)


### Design patterns

The general adopted pattern is a controller-services approach for this simple app.

The project structure allows setting clear boundaries among each components scope and dependencies. Moreover extracting the actual 4 services into separate and autonomous full modules (having their own controller, exposed RPC API, etc) is made easily possible.

#### Service binding
To lower done the dependency among services, they don't communicate directly to each other. Instead the listeners callback are registered to the triggerer. This binding of services (handler's callback registration) is performed by the app controller. 2 mains types have been implemented:
* EventEmitter-based technique for Ingestors to register their callback to be given for a given event-name
* Interface method direct registration for Events handlers callback to be triggered by event-compatible Ingestor services

Refer to the operated bindings in [AppController.bindServices()](./src/app.controller.ts).

#### Delaying
In order to schedule/delay an action (e.g. casting next account update event) or to way for a state (e.g. wait for all callbacks to be triggered before shutting down) a simple Node.js based Timeout technique is used.

#### Validating
A Code-as-Schema approach has been opted to validate and filter out problematic account update events. The implemented technique is based on [class-validator](https://www.npmjs.com/package/class-validator). Fields and values are checked per the constrained implemented for example in [account-update.dto.ts](./src/data/account-update.dto.ts).


### Technical considerations

The [Node.js](https://nodejs.org) runtime framework is used for handling a minimal server application.

The [Nest.js](https://nestjs.com) development framework is used for benefiting from its modularity and the reuse of bullet-proof design patterns, reusable components and low footprint in terms of performance impact. The underlying [Express.js](https://expressjs.com) platform has been opted, and a minimal REST API has been initiated at the application controller level. Refer to the minimal [landing page](http://localhost:3000) when the app is locally running.

The TypeScript programming language is used for its type safety and general improvements over JavaScript.

The testing framework is made of the [Jest.js](https://jestjs.io) & [Chai](https://www.chaijs.com/) solutions.

### Production Considerations

The integrated Logging technique is based on the production-grade flexible [Winston Logger](https://www.npmjs.com/package/winston). In production mode (`NODE_ENV=prod`) the console output is disabled and logs are aggregated in a JSON file, with the provided log level thresholds. The later enables a log watcher service such as Kibana or LogWatcher to integrate these logs and define filters and alerts for a continuous monitoring. 
*Note*: A file rollout mechanism based on the file size or content length must be implemented on the network file system.

As long as there is no external data persistency, current implementation stored all data in memory. This is problematic for the current account update events' ingestion service since it keeps in memory an entry for every met account. This is not scalable on a real system. Other services have limited states storage in memory, those are temporary (callback handler service) and/or limited (tokens leaderboard).

Actual implementation automatically shuts down once all account update events are processed. On an actual system, a ping & status REST API should be used to check for the service availability. Else the Docker container's resources usage (CPU, memory, network usage) would have to be monitored and a scaling service such as K8s or Fargate being considered, as well as KV-based caching and/or event-based coordination systems among the app instances.

The interesting challenge for going to production is to replace actual mock implementation to cast events by an actual external data source integration: a continuous polling or event-driven (Websock, Event/Message Queuing), then the integration will be fun and performance considerations further challenged.

Such external services would also have to be continuously monitored (external data source server, in memory caching & database): their access, availability, performance and operating costs.

## Tasks

### Features support

- [x] Create classes having appropriate encapsulation, attributes, and well deﬁned interfaces.

- [x] Account updates' data are read asynchronously from a json ﬁle (Vs. a live continuous data stream)

- [x] Each account comes into the system at a continuous uniform (random) distribution between 0 and 1000ms

- [x] Display a short message log message to console when each (accountId + version) tuple has been indexed.

  - [x] If an old version of the same account is ingested, ignore that update.

- [x] Display a callback log when an account’s `call_back_time_ms` has expired. 

  - [x] If the same account is ingested with a newer version number, and the old callback has not ﬁred yet, cancel the older version’s active callback. 

  - [x] Display a message when an old callback is canceled in favor of a new one

- [x] Once all events and callbacks have completed, print the highest token-value accounts by AccountType (taking into account the right version), and gracefully shut-down the system.

### Project support

1. A README ﬁle that contains:
- [x] Instructions on how to run and test your code in a local environment through the command line.
- [x] A description of how and why you chose the design patterns you did
- [x] A description of what observability you would add if this was a production system.
  What would you monitor for a production rollout?

2. Production-ready code that:
- [x] Follows community standard syntax and style
- [x] Has no debug logging, TODOs, or FIXMEs
- [x] Has test coverage to ensure quality and safety *(Actual is minimal)*


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