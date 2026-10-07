# Modules

A Spire module is an independent npm package containing a complete optional capability.

Recommended repository naming:

```text
spire-module-schedule
spire-module-people
spire-module-crm
```

## Package convention

Example `package.json`:

```json
{
  "name": "@spire/module-people",
  "version": "1.0.0",
  "type": "module",
  "peerDependencies": {
    "@spire/kernel": "^0.1.0"
  },
  "exports": {
    "./manifest": "./spire.module.js",
    "./api": "./api/index.js",
    "./events": "./api/events.js",
    "./web": "./web/index.js"
  }
}
```

The `./events` export is optional.

## Manifest

```js
export default {
  id: "people",
  name: "People",
  version: "1.0.0",
  database: {
    schema: "people"
  },
  api: {
    prefix: "/api/people"
  }
};
```

A database schema is mandatory for a Spire module.

## Backend

`./api` exports a Fastify plugin.

```js
import { db } from "@spire/kernel";

export default async function peopleApi(app) {
  app.get("/", async () => {
    return db("people.person").select("*");
  });
}
```

## Frontend

`./web` exports a module definition.

```js
export default {
  id: "people",

  menu: [
    {
      id: "people",
      label: "Pessoas",
      to: "/people",
      order: 100
    }
  ],

  routes: [
    {
      path: "/people",
      component: () => import("./pages/PeoplePage.vue")
    }
  ]
};
```

The Spire build generates a static frontend registry from installed npm dependencies so Vite can bundle module code.

## Events

Optional `./events` export:

```js
export default async function register({ events }) {
  events.on(
    "people.created",
    "crm.people-created",
    async (event) => {
      // durable subscriber
    },
    {
      moduleKey: "crm"
    }
  );
}
```

Subscriber keys must be globally unique and stable.

## Installation

Installation is npm-driven:

```bash
npm install @spire/module-people
```

Removal:

```bash
npm uninstall @spire/module-people
```

Upgrade:

```bash
npm install @spire/module-people@1.2.0
```

Rollback of code is installation of a previous package version followed by a new build/deploy.

No runtime install/enable/disable API is part of the kernel.

## Database ownership

Each module changes only its own schema.

A module may create a foreign key to another module when the dependency is explicit, but it must never alter the other module's tables.
