import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

function csv(value) {
  if (!value) return [];
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.string().default("info"),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  SPIRE_MODULE_PREFIX: z.string().default("@spire/module-"),
  SPIRE_MODULE_PACKAGES: z.string().default(""),
  DB_CONTRACT_SCHEMAS: z.string().default("kernel"),
  AUTH_MAX_SESSIONS_PER_USER: z.coerce.number().int().positive().default(1),
  AUTH_SESSION_IDLE_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(1800),
  AUTH_SESSION_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(86400),
  EVENT_WORKER_POLL_MS: z.coerce.number().int().positive().default(1000),
  EVENT_WORKER_BATCH_SIZE: z.coerce.number().int().positive().default(20),
  EVENT_WORKER_MAX_ATTEMPTS: z.coerce.number().int().positive().default(10),
  EVENT_WORKER_LOCK_TIMEOUT_MS: z.coerce.number().int().positive().default(300000),
  FILES_STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  FILES_LOCAL_DIR: z.string().default("./storage/files"),
});

const raw = schema.parse(process.env);

export const config = {
  ...raw,
  modulePackages: csv(raw.SPIRE_MODULE_PACKAGES),
  contractSchemas: csv(raw.DB_CONTRACT_SCHEMAS),
  filesLocalDir: path.resolve(raw.FILES_LOCAL_DIR),
};
