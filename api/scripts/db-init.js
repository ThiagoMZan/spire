import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDb } from "../src/database/knex.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlPath = path.resolve(__dirname, "..", "db", "bootstrap", "kernel.sql");
const db = createDb();

try {
  await db.raw(fs.readFileSync(sqlPath, "utf8"));
  console.log("Spire kernel database bootstrap applied.");
} finally {
  await db.destroy();
}
