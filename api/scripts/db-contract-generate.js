import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDatabaseContract } from "./db-contract-lib.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const output = path.resolve(__dirname, "..", "..", "contracts", "database", "database.generated.json");

const contract = await buildDatabaseContract();
fs.writeFileSync(output, JSON.stringify(contract, null, 2) + "\n");
console.log(`Database contract written to ${output}`);
