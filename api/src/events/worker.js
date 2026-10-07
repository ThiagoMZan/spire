import { hostname } from "node:os";
import { randomUUID } from "node:crypto";
import { initializeKernelRuntime } from "@spire/kernel/internal";

import { config } from "../config.js";
import { createDb } from "../database/knex.js";
import { createEventBus } from "./event-bus.js";
import { loadInstalledEventModules } from "../modules/loader.js";

const workerId = `${hostname()}:${process.pid}:${randomUUID().slice(0, 8)}`;
const db = createDb();
const events = createEventBus({ db, logger: console });
let stopping = false;

initializeKernelRuntime({
  db,
  events,
  logging: console,
  config,
  getRequestContext: () => null,
});

await loadInstalledEventModules({ events, logger: console });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function claimBatch() {
  return db.transaction(async (trx) => {
    const rows = await trx("kernel.event_delivery as d")
      .join("kernel.event_outbox as e", "e.id", "d.event_id")
      .where("d.status", "pending")
      .where("d.available_at", "<=", trx.fn.now())
      .orderBy("d.created_at", "asc")
      .select(
        "d.id",
        "d.event_id",
        "d.subscriber_key",
        "d.module_key",
        "d.attempts",
        "e.event_name",
        "e.payload",
        "e.metadata",
        "e.source_module",
        "e.created_at as event_created_at",
      )
      .forUpdate()
      .skipLocked()
      .limit(config.EVENT_WORKER_BATCH_SIZE);

    if (!rows.length) return [];

    await trx("kernel.event_delivery")
      .whereIn("id", rows.map((row) => row.id))
      .update({
        status: "processing",
        locked_at: trx.fn.now(),
        locked_by: workerId,
      });

    return rows;
  });
}

async function markSucceeded(id) {
  await db("kernel.event_delivery").where({ id }).update({
    status: "succeeded",
    processed_at: db.fn.now(),
    locked_at: null,
    locked_by: null,
    last_error: null,
  });
}

async function markFailed(row, error) {
  const attempts = Number(row.attempts || 0) + 1;
  const exhausted = attempts >= config.EVENT_WORKER_MAX_ATTEMPTS;
  const delaySeconds = Math.min(300, Math.max(1, 2 ** Math.min(attempts, 8)));

  await db("kernel.event_delivery").where({ id: row.id }).update({
    status: exhausted ? "failed" : "pending",
    attempts,
    available_at: exhausted
      ? db.fn.now()
      : db.raw("NOW() + (? * INTERVAL '1 second')", [delaySeconds]),
    locked_at: null,
    locked_by: null,
    last_error: String(error?.stack || error?.message || error).slice(0, 8000),
  });
}

async function processDelivery(row) {
  const subscriber = events.getSubscriber(row.event_name, row.subscriber_key);

  if (!subscriber) {
    await markFailed(row, new Error(`event_subscriber_not_found:${row.subscriber_key}`));
    return;
  }

  try {
    await subscriber.handler({
      id: row.event_id,
      name: row.event_name,
      payload: row.payload || {},
      metadata: row.metadata || {},
      sourceModule: row.source_module,
      createdAt: row.event_created_at,
    });
    await markSucceeded(row.id);
  } catch (error) {
    console.error("event delivery failed", {
      deliveryId: row.id,
      eventName: row.event_name,
      subscriberKey: row.subscriber_key,
      error,
    });
    await markFailed(row, error);
  }
}

async function runLoop() {
  while (!stopping) {
    const batch = await claimBatch();
    if (!batch.length) {
      await sleep(config.EVENT_WORKER_POLL_MS);
      continue;
    }
    await Promise.all(batch.map(processDelivery));
  }
}

function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  console.log("Spire event worker stopping", { signal, workerId });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

console.log("Spire event worker started", { workerId });

try {
  await runLoop();
} finally {
  await db.destroy();
}
