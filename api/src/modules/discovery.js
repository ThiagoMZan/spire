import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..", "..");

function readRootPackage() {
  return JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
}

export function getInstalledModulePackages() {
  const pkg = readRootPackage();
  const dependencies = { ...(pkg.dependencies || {}), ...(pkg.optionalDependencies || {}) };
  const discovered = Object.keys(dependencies).filter((name) =>
    name.startsWith(config.SPIRE_MODULE_PREFIX),
  );
  return [...new Set([...discovered, ...config.modulePackages])].sort();
}

export async function loadModuleManifest(packageName) {
  const imported = await import(`${packageName}/manifest`);
  const manifest = imported.default || imported.manifest;

  if (!manifest?.id || !manifest?.version) {
    throw new Error(`spire_module_manifest_invalid:${packageName}`);
  }

  if (!manifest.database?.schema) {
    throw new Error(`spire_module_schema_required:${packageName}`);
  }

  return { packageName, ...manifest };
}

export async function discoverInstalledModules() {
  const modules = [];
  for (const packageName of getInstalledModulePackages()) {
    modules.push(await loadModuleManifest(packageName));
  }
  return modules;
}
