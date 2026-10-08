# Development

## Requirements

- Node.js 22+;
- PostgreSQL 16+ recommended;
- npm.

## Start PostgreSQL

```bash
docker compose up -d
```

## Environment

```bash
cp .env.example .env
```

## Install

```bash
npm install
```

npm workspaces exposes the public `@spire/kernel` package from `packages/kernel`.

## Bootstrap a fresh kernel schema

```bash
npm run db:init
```

The bootstrap is only a starting point for a fresh database. It is not the database contract.

## Generate the database contract

```bash
npm run db:contract:generate
```

## API and web together

```bash
npm run dev
```

On Windows PowerShell, use `npm.cmd run dev` if execution policy blocks npm.ps1.

This starts both processes in one terminal, with api/web log prefixes. The API restarts when imported code changes; Vite updates the frontend. Ctrl+C stops both processes. If either process exits, the other is stopped too. To restart both manually, press Ctrl+C and run the command again. Stop previously started standalone API/web processes before switching to this command.

## API

```bash
npm run dev:api
```

Health:

```text
GET http://localhost:3000/api/health
```

Installed modules:

```text
GET http://localhost:3000/api/kernel/modules
```

## Web

```bash
npm run dev:web
```

Vite proxies `/api` to port 3000.

For a production-like build:

```bash
npm run build:web
npm start
```

Fastify serves `web/dist` when it exists.

## Event worker

```bash
npm run events:worker
```

## Adding a module locally

```bash
npm install ../spire-module-example
npm run modules:generate
```

For a published module:

```bash
npm install @spire/module-example
```

Restart the API after changing installed backend modules and rebuild/regenerate the frontend registry.
