import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildDatabaseContract } from "./db-contract-lib.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contractPath = path.resolve(__dirname, "..", "..", "contracts", "database", "database.generated.json");

if (!fs.existsSync(contractPath)) {
  console.error("Database contract does not exist. Run npm run db:contract:generate.");
  process.exit(1);
}

const expected = fs.readFileSync(contractPath, "utf8").trim();
const current = JSON.stringify(await buildDatabaseContract(), null, 2);

if (expected !== current) {
  console.error("Database contract is out of date.");
  console.error("Run npm run db:contract:generate and review the diff.");
  process.exit(1);
}

console.log("Database contract matches the current database.");
