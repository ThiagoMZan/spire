import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export function createLocalStorage({ rootDir }) {
  const root = path.resolve(rootDir);

  function resolveSafe(relativePath) {
    const absolute = path.resolve(root, relativePath);
    if (absolute !== root && !absolute.startsWith(root + path.sep)) {
      throw new Error("file_storage_path_invalid");
    }
    return absolute;
  }

  return {
    driver: "local",

    async save({ buffer, extension = "" }) {
      const now = new Date();
      const folder = path.join(
        String(now.getUTCFullYear()),
        String(now.getUTCMonth() + 1).padStart(2, "0"),
      );
      const normalizedExtension = extension
        ? "." + String(extension).replace(/^\./, "").replace(/[^a-zA-Z0-9]/g, "")
        : "";
      const storagePath = path.join(folder, randomUUID() + normalizedExtension);
      const absolute = resolveSafe(storagePath);

      await fs.mkdir(path.dirname(absolute), { recursive: true });
      await fs.writeFile(absolute, buffer);

      return { storagePath };
    },

    async read(storagePath) {
      return fs.readFile(resolveSafe(storagePath));
    },

    async remove(storagePath) {
      await fs.rm(resolveSafe(storagePath), { force: true });
    },
  };
}
