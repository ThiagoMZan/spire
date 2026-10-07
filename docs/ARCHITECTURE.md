# Spire Architecture

## Purpose

Spire is a small application kernel. It provides infrastructure that every module can use, but it does not own business features.

## Stack

- JavaScript;
- Fastify;
- Knex;
- PostgreSQL;
- Vue 3 + Vite;
- npm packages for modules.

## Kernel responsibilities

The kernel owns infrastructure such as:

- HTTP/bootstrap;
- database access;
- module discovery;
- public module APIs;
- authentication/session infrastructure;
- permission infrastructure;
- hooks;
- durable events/outbox;
- files/storage abstraction;
- HTTP client;
- structured logging;
- request context;
- configuration;
- frontend shell/layout/router;
- database contract tooling.

The kernel must not own feature modules such as:

- scheduler;
- jobs;
- people;
- CRM;
- forms/low-code;
- customer-specific behavior.

## Frontend and backend

They live in the same repository and are shipped together, but remain separated:

```text
api/
web/
```

A production build may be served by the Fastify host. During development Vite runs separately and proxies `/api`.

The same rule applies to modules: one npm package may contain its API, frontend and contracts.

## Public kernel package

The repository is the runnable Spire host. The public API consumed by modules is isolated as an npm workspace:

```text
packages/kernel
  -> @spire/kernel
```

This keeps module code away from internal implementation files and gives us a package that can be versioned/published independently.

## Installed means available

There is no runtime activate/deactivate mechanism.

```text
package.json / package-lock.json
          |
          v
npm install
          |
          v
module exists
```

If the package is absent, the functionality does not exist.

This makes deployments deterministic and stateless.

## Public API boundary

Modules must not import kernel internals.

Correct:

```js
import {
  db,
  hooks,
  events,
  files,
  http,
  logging
} from "@spire/kernel";
```

Incorrect:

```js
import something from "../../../spire/api/src/internal-file.js";
```

The public API is a compatibility boundary.

## Database ownership

Each module owns one PostgreSQL schema by default.

Examples:

```text
kernel.*
people.*
crm.*
schedule.*
customer_acme.*
```

A module may reference another module's tables, but must not own or alter them.

Rule:

> May reference; may not own or modify.

If CRM needs extra data for a person, it creates data in `crm.*` and references `people.person`.

## Evolution

Prefer the simplest infrastructure that satisfies the current requirement.

Do not add Redis, RabbitMQ, Kafka or Kubernetes merely because they may be useful later.
