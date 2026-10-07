# Database Contracts

Spire separates database state from database evolution.

```text
PostgreSQL        = truth
Knex              = access/query builder
Database Contract = description of current state
Migration         = controlled evolution between states
```

## Why

Migration history is useful for deployment, but it is a poor way to understand the current database.

The contract is generated from the live PostgreSQL catalog and committed to Git.

## Workflow

A development workflow may be:

```text
change development database
        |
        v
npm run db:contract:generate
        |
        v
review Git diff
        |
        v
create the controlled deployment change/migration
```

The generated contract is descriptive and must not automatically alter production.

## Generate

Configure schemas:

```env
DB_CONTRACT_SCHEMAS=kernel,people,crm
```

Then:

```bash
npm run db:contract:generate
```

Output:

```text
contracts/database/database.generated.json
```

The initial generator captures:

- schemas;
- tables;
- columns;
- native/data types;
- nullability;
- defaults;
- lengths/precision;
- primary keys;
- foreign keys.

## Check

```bash
npm run db:contract:check
```

This compares the committed contract against the current database.

## Semantic metadata

Generated structure and human semantics are separate.

Example:

`contracts/database/kernel.meta.json`

This may contain labels or other platform meaning that PostgreSQL cannot infer.

Do not edit `database.generated.json` manually.

## Module schemas

Each module declares its schema in its manifest.

A module's contract must describe only schemas it owns.

Cross-schema foreign keys are allowed when dependencies are explicit, but ownership never transfers.
