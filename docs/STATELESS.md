# Stateless

Spire is stateless by default.

## Definition

An API instance must not own functional state required for a later request or for another instance to continue processing.

Shared durable state belongs in PostgreSQL or another explicit shared provider.

## Allowed in memory

In-memory state is acceptable when it is:

- request-local;
- process-local configuration reconstructed at startup;
- registered code such as hooks;
- cache whose loss does not affect correctness.

Examples:

- AsyncLocalStorage request context;
- Hook Bus listener registry;
- installed module registry generated from the build.

## Not allowed as source of truth

Do not keep these only in process memory:

- sessions;
- durable events;
- uploaded files in production;
- business state;
- cross-instance locks;
- module activation state.

## Sessions

Human sessions will be persisted in PostgreSQL.

Any API instance must be able to validate the same session.

## Modules

Every deployed instance uses the same package-lock/build and therefore has the same modules.

There is no per-instance dynamic module activation.

## Events

Events use PostgreSQL outbox/delivery tables.

Publishing the business record and event can occur inside the same Knex transaction.

Multiple event workers claim deliveries using PostgreSQL row locking and `SKIP LOCKED`.

## Files

Local filesystem is acceptable only for development.

Production storage must use a shared/object-storage provider.

## Logs

Technical logs go to stdout as structured logs.

Functional/legal audit, when introduced, is persistent data and does not depend on local log files.

## Future infrastructure

Additional infrastructure is introduced only for a concrete need.

Examples:

- Redis for shared cache/rate limit;
- RabbitMQ/Kafka/Redis Streams for high-volume messaging/realtime;
- object storage for files.

These can coexist with the kernel without changing module contracts.
