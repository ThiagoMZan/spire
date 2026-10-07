# Public Kernel API

The public API is the only supported integration surface for modules.

Current initial exports:

```js
import {
  db,
  hooks,
  events,
  http,
  logging,
  getRequestContext
} from "@spire/kernel";
```

## db

Knex instance facade.

```js
const rows = await db("people.person")
  .where({ active: true });

await db.transaction(async (trx) => {
  // ...
});
```

## hooks

Synchronous extension points.

Use hooks when another component must participate in the current operation and may change/reject it.

```js
hooks.on("people.before-save", async (context) => {
  context.data.name = context.data.name.trim();
});

await hooks.trigger("people.before-save", context);
```

## events

Durable facts.

```js
await events.publish(
  "people.created",
  { personId },
  { trx }
);
```

Use an event when something has already happened and consumers react asynchronously.

## http

Kernel HTTP client wrapper.

## logging

Structured kernel logger.

## getRequestContext

Returns request-local state such as request id and, later, authenticated principal.

## Future exports

Expected core contracts include files, auth/permissions and configuration.

They should be added only when their public semantics are clear.
