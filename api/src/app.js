import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { initializeKernelRuntime } from "@spire/kernel/internal";

import { config } from "./config.js";
import { createDb } from "./database/knex.js";
import { createHookBus } from "./hooks/hook-bus.js";
import { createEventBus } from "./events/event-bus.js";
import { createFilesService } from "./files/files-service.js";
import { createConfiguredStorage } from "./files/storage/index.js";
import { createHttpClient } from "./http/http-client.js";
import { requestContextPlugin } from "./request-context/plugin.js";
import { getRequestContext } from "./request-context/index.js";
import { discoverInstalledModules } from "./modules/discovery.js";
import { loadInstalledApiModules, loadInstalledEventModules } from "./modules/loader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDist = path.resolve(__dirname, "..", "..", "web", "dist");

export async function buildApp() {
  const app = Fastify({ logger: { level: config.LOG_LEVEL } });
  const db = createDb();
  const hooks = createHookBus({ logger: app.log });
  const events = createEventBus({ db, logger: app.log });
  const files = createFilesService({
    db,
    storage: createConfiguredStorage(config),
  });
  const http = createHttpClient({ logger: app.log });

  initializeKernelRuntime({
    db,
    hooks,
    events,
    files,
    http,
    logging: app.log,
    config,
    getRequestContext,
  });

  await app.register(cors, { origin: config.CORS_ORIGIN, credentials: true });
  await app.register(requestContextPlugin);

  app.get("/api/health", async () => ({ ok: true, service: "spire" }));
  app.get("/api/kernel/modules", async () => ({ items: await discoverInstalledModules() }));

  await loadInstalledEventModules({ events, logger: app.log });
  await loadInstalledApiModules(app);

  if (fs.existsSync(webDist)) {
    await app.register(fastifyStatic, {
      root: webDist,
      wildcard: false,
    });

    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith("/api/")) {
        return reply.code(404).send({ error: "not_found" });
      }
      return reply.sendFile("index.html");
    });
  }

  app.addHook("onClose", async () => db.destroy());
  return app;
}
