# Spire

Spire is a modular application kernel built with JavaScript, Fastify, Knex, PostgreSQL and Vue 3.

The kernel owns infrastructure. Business capabilities live in independent npm modules.

## Principles

- stateless by default;
- JavaScript, not TypeScript;
- Fastify + Knex + PostgreSQL;
- Vue 3 frontend in the same repository, separated from the API;
- one PostgreSQL schema per module;
- modules are npm packages containing backend + frontend + contracts;
- if a module package is installed, the module exists;
- no runtime activate/deactivate mechanism;
- modules use only the public `@spire/kernel` API;
- hooks are synchronous/local extension points;
- events are durable and PostgreSQL-backed;
- jobs and schedules are module responsibilities;
- database contracts describe the current database through introspection.

## Quick start

```bash
cp .env.example .env
docker compose up -d
npm install
npm run db:init
npm run db:contract:generate
npm run dev:api
npm run dev:web
```

Durable event processing runs in a separate process:

```bash
npm run events:worker
```

Start with `docs/ARCHITECTURE.md`.
