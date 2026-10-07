import { createLocalStorage } from "./local-storage.js";

export function createConfiguredStorage(config) {
  if (config.FILES_STORAGE_DRIVER === "local") {
    return createLocalStorage({ rootDir: config.filesLocalDir });
  }

  throw new Error(`file_storage_driver_not_implemented:${config.FILES_STORAGE_DRIVER}`);
}
