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

## Bootstrap a fresh kernel schema

```bash
npm run db:init
```

The bootstrap is only a starting point for a fresh database. It is not the database contract.

## Generate the database contract

```bash
npm run db:contract:generate
```

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
