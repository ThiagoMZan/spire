# Phase 1 — Minimal Backend Architecture

This document defines the first implementation phase of Spire.

The goal is intentionally narrow: validate the backend/module architecture before adding web, durable events, files, jobs, schedules, database contracts or other platform features.

## Stack

Phase 1 uses only:

- JavaScript (no TypeScript);
- Express;
- PostgreSQL;
- Knex;
- JWT access tokens for API authentication;
- Postman for validation.

The architecture must remain stateless and must already follow the same module rules that future business modules will use.

## Main architectural rule

The kernel and the core module are different things.

```text
@spire/kernel
    =
platform infrastructure exposed to modules

@spire/module-core
    =
an ordinary Spire module that uses @spire/kernel
```

The core module must not receive privileged internal access merely because it is mandatory.

It must use the same public APIs that every future module will use.

This is intentional: the core module is the first reference module and validates the module contract.

## What belongs in @spire/kernel

For Phase 1, keep the public surface intentionally small.

```js
import {
  db,
  auth,
  access
} from "@spire/kernel";
```

### db

A Knex facade used by modules.

Example:

```js
import { db } from "@spire/kernel";

const user = await db("core.user")
  .where({ email })
  .first();
```

The module knows its own schema and tables.

The kernel does not own the module's data model.

### auth

Authentication primitives.

Phase 1 responsibilities:

- hash passwords;
- verify passwords;
- issue access tokens;
- verify access tokens;
- read Bearer tokens from a request;
- populate the authenticated principal on the request.

The authentication primitive must not know how to query `core.user`.

That lookup belongs to the core module.

Example login flow:

```text
POST /api/auth/login
      |
      v
module-core queries core.user
      |
      v
module-core verifies password through auth
      |
      v
module-core calls auth.issueToken(...)
      |
      v
returns accessToken
```

This keeps the dependency direction correct.

### access

Authorization middleware and route metadata.

Default rule:

> Every route is authenticated unless it is explicitly declared public.

Initial API:

```js
access.public()
access.enforce()
```

Later this may grow into:

```js
access.permission(...)
access.all(...)
access.any(...)
```

Do not implement those until the minimal authentication flow is validated.

## Request authentication model

Authentication and authorization are separate.

### authentication

Authentication tries to identify the caller.

Conceptually:

```js
app.use(auth.middleware());
```

It reads:

```http
Authorization: Bearer <token>
```

If the token is valid:

```js
req.user = {
  id: "...",
  email: "..."
};
```

If no token exists, authentication does not automatically reject the request.

It leaves:

```js
req.user = null;
```

### authorization

Authorization decides whether the route may continue.

Conceptually:

```js
app.use(access.enforce());
```

Default behavior:

```text
public route
    -> continue

authenticated route + req.user
    -> continue

authenticated route + no req.user
    -> HTTP 401
```

This separation is important because the same authorization layer can later support both API tokens and browser sessions.

## Public routes

A route must be public only when explicitly marked.

Example:

```js
app.use("/api/auth/login", access.public());
```

Internally `access.public()` should only add request metadata.

Conceptually:

```js
req.access = {
  ...req.access,
  public: true
};
```

The enforcement middleware interprets that metadata later.

This means the platform can evolve without changing the module route style.

## Middleware order

Express middleware order is part of the architecture.

The desired flow is:

```text
request
  |
  v
auth.middleware()
  |
  v
route access metadata
  |
  v
access.enforce()
  |
  v
route handler
```

The login route must therefore be marked public before the global enforcement middleware rejects anonymous requests.

A minimal conceptual registration is:

```js
app.use(auth.middleware());

app.use("/api/auth/login", access.public());

app.use(access.enforce());

app.post("/api/auth/login", loginHandler);
```

When module loading is introduced, preserve this semantic ordering.

## Core module

The core module is the first real Spire module.

Recommended package name:

```text
@spire/module-core
```

Initial responsibility:

- own the `core` PostgreSQL schema;
- own the `core.user` table;
- expose authentication-related routes;
- use only public APIs from `@spire/kernel`.

Suggested structure:

```text
modules/core/
  package.json
  index.js
  routes/
    auth.js
  services/
    user-service.js
```

Later it can become an independent npm package without changing its internal architecture.

## Module entrypoint

The platform must load one entrypoint per module.

The platform must not scan or understand a module's internal `routes/*.js` files.

Example:

```js
// modules/core/index.js

import authRoutes from "./routes/auth.js";

export default function coreModule(app) {
  app.use("/api/auth", authRoutes);
}
```

The module itself decides how many route files it has.

A small module may keep everything in `index.js`.

A larger module may use:

```text
routes/
services/
repositories/
```

This is a module implementation detail, not a kernel concern.

## Core auth routes

Initial routes:

```text
POST /api/auth/login
GET  /api/auth/me
```

### POST /api/auth/login

Public.

Example request:

```json
{
  "email": "admin@example.com",
  "password": "secret"
}
```

Flow:

```text
find user in core.user
      |
      v
verify password
      |
      v
verify user is active
      |
      v
issue JWT
      |
      v
return accessToken
```

Example response:

```json
{
  "accessToken": "<jwt>"
}
```

### GET /api/auth/me

Authenticated by default.

Example request:

```http
GET /api/auth/me
Authorization: Bearer <jwt>
```

Example response:

```json
{
  "id": "...",
  "email": "admin@example.com"
}
```

## Token design

Phase 1 uses JWT access tokens.

The token should contain only the minimum stable identity information required to authenticate the request.

Initial claims may be:

```json
{
  "sub": "<user-id>",
  "email": "admin@example.com"
}
```

Do not put the whole user record or a large permission list into the token yet.

Suggested properties:

- signed with a shared secret initially;
- expiration required;
- all API instances use the same signing configuration;
- no token state stored in process memory.

This is stateless.

Later the signing mechanism may move to asymmetric keys without changing the public auth API.

## Future browser session support

The future web frontend must not require a new authorization architecture.

The target model is:

```text
Bearer token --------\
                      -> auth middleware -> req.user
Session cookie ------/
                              |
                              v
                       access.enforce()
```

So authorization only cares about:

```js
req.user
```

It must not care whether the principal came from:

- a JWT Bearer token;
- a PostgreSQL-backed browser session;
- another authentication strategy added later.

For Phase 1 only Bearer JWT is implemented.

## PostgreSQL

The core module owns its schema.

Initial schema:

```sql
CREATE SCHEMA core;

CREATE TABLE core.user (
  id uuid PRIMARY KEY,
  email varchar(255) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

The exact bootstrap mechanism can remain simple during Phase 1.

Database contracts and the final schema-evolution strategy are deliberately postponed until the route/module/auth model is validated.

## Stateless requirements

The initial backend must be safe to run as:

```text
             Load Balancer
           /      |      \
        API 1   API 2   API 3
           \      |      /
              PostgreSQL
```

Therefore:

- no authenticated user state stored in process memory;
- no token registry stored in process memory;
- all instances use the same JWT signing configuration;
- user data lives in PostgreSQL;
- route/module registration in memory is acceptable because it is rebuilt on startup from code.

Stateless does not mean "nothing in memory".

It means no process-local memory is required for another request to continue correctly.

## Minimal repository shape

For this phase, prefer clarity over abstraction.

```text
spire/
  src/
    app.js
    server.js

    kernel/
      database/
      auth/
      access/
      modules/

    modules/
      core/
        index.js
        routes/
          auth.js
        services/

      example/
        index.js
        routes/

  package.json
  .env.example
```

The implementation may later extract the public kernel into a separate workspace/package, but the module-facing imports should already represent the intended final API.

## Example module

Create one tiny non-core module to prove that core is not special.

Example:

```text
modules/example/
  index.js
  routes/
    example.js
```

Protected route:

```http
GET /api/example
```

Optional public test route:

```http
GET /api/example/public
```

The example module must use exactly the same `@spire/kernel` APIs as the core module.

## Phase 1 acceptance tests

Validate manually with Postman before adding more architecture.

1. Login succeeds with valid credentials:

```text
POST /api/auth/login
-> 200 + accessToken
```

2. Login is reachable without authentication:

```text
POST /api/auth/login
-> must not return 401 only because no token exists
```

3. Protected route without token:

```text
GET /api/example
-> 401
```

4. Protected route with valid token:

```text
GET /api/example
Authorization: Bearer <token>
-> 200
```

5. Invalid token:

```text
GET /api/example
Authorization: Bearer invalid
-> 401
```

6. Public route:

```text
GET /api/example/public
-> 200 without token
```

7. Identity route:

```text
GET /api/auth/me
Authorization: Bearer <token>
-> authenticated user
```

8. Run two API instances with the same database and JWT secret.

A token generated by API 1 must work on API 2.

That validates the initial stateless model.

## Explicitly out of scope for Phase 1

Do not implement yet:

- Vue/web frontend;
- browser sessions;
- refresh tokens;
- fine-grained permissions;
- roles;
- hooks;
- event bus;
- jobs;
- scheduler;
- files;
- cache;
- module npm publishing;
- automatic module discovery;
- database contracts;
- migration framework;
- S3;
- realtime.

These are intentionally postponed.

## Next step after validation

Once this phase feels good to use, add permissions without changing the route/auth fundamentals.

The likely evolution is:

```js
app.use(
  "/api/admin",
  access.permission("admin.access")
);

app.use(
  "/api/admin/users",
  access.permission("users.manage")
);
```

Then validate how access rules compose before moving to the next platform concern.

## Guiding principle

Build the core module exactly as any other module.

If the core module needs a privileged import or a special route-registration path, treat that as an architectural warning.

The first milestone is not feature completeness.

The first milestone is proving that:

```text
Express
+ PostgreSQL
+ Knex
+ @spire/kernel public API
+ module-core
+ module-example
+ JWT authentication
+ public/private route policy
```

is simple, understandable and pleasant to extend.
