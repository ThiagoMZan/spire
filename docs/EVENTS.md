# Events

Events are a core stateless primitive.

## Difference from hooks

```text
HOOK
  participates in the current operation
  synchronous/awaited
  may modify or reject

EVENT
  announces a fact that already happened
  durable
  asynchronous
  retried independently
```

## Publishing

```js
await db.transaction(async (trx) => {
  const [person] = await trx("people.person")
    .insert(data)
    .returning("*");

  await events.publish(
    "people.created",
    { personId: person.id },
    {
      trx,
      sourceModule: "people"
    }
  );
});
```

The business row, outbox event and delivery rows commit together.

## Subscribers

```js
events.on(
  "people.created",
  "crm.people-created",
  async (event) => {
    // ...
  },
  {
    moduleKey: "crm"
  }
);
```

Subscriber keys must be unique and stable.

## Worker

Run:

```bash
npm run events:worker
```

The worker claims pending deliveries with PostgreSQL row locks and `SKIP LOCKED`.

Multiple workers can run at the same time.

Failures use exponential retry up to `EVENT_WORKER_MAX_ATTEMPTS`.

Processing is at-least-once, so subscribers must be idempotent.

## Why this is in the kernel

Durable module-to-module events are infrastructure used by many capabilities.

Jobs and schedules are different: they represent work requested by a feature and belong in a separate module.

```text
HOOK      participates
EVENT     communicates a durable fact
JOB       executes requested work
SCHEDULE  decides when work should run
```
