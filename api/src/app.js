import Fastify from "fastify";
import cors from "@fastify/cors";

import { config } from "./config.js";
import { createDb } from "./database/knex.js";
import { createHookBus } from "./hooks/hook-bus.js";
import { createEventBus } from "./events/event-bus.js";
import { createHttpClient } from "./http/http-client.js";
import { requestContextPlugin } from "./request-context/plugin.js";
import { initializeKernelRuntime } from "./public/runtime.js";
import { discoverInstalledModules } from "./modules/discovery.js";
import { loadInstalledApiModules, loadInstalledEventModules } from "./modules/loader.js";

export async function buildApp() {
  const app = Fastify({ logger: { level: config.LOG_LEVEL } });
  const db = createDb();
  const hooks = createHookBus({ logger: app.log });
  const events = createEventBus({ db, logger: app.log });
  const http = createHttpClient({ logger: app.log });

  initializeKernelRuntime({ db, hooks, events, http, logging: app.log, config });

  await app.register(cors, { origin: config.CORS_ORIGIN, credentials: true });
  await app.register(requestContextPlugin);

  app.get("/api/health", async () => ({ ok: true, service: "spire" }));
  app.get("/api/kernel/modules", async () => ({ items: await discoverInstalledModules() }));

  await loadInstalledEventModules({ events, logger: app.log });
  await loadInstalledApiModules(app);

  app.addHook("onClose", async () => db.destroy());
  return app;
}
