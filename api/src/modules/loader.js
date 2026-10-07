import { discoverInstalledModules } from "./discovery.js";

function missingOptionalSubpath(error, packageName, subpath) {
  if (error?.code === "ERR_PACKAGE_PATH_NOT_EXPORTED") return true;

  return (
    error?.code === "ERR_MODULE_NOT_FOUND" &&
    String(error?.message || "").includes(packageName) &&
    String(error?.message || "").includes(subpath)
  );
}

export async function loadInstalledApiModules(app) {
  const modules = await discoverInstalledModules();

  for (const module of modules) {
    try {
      const imported = await import(`${module.packageName}/api`);
      const plugin = imported.default || imported.plugin;
      if (typeof plugin !== "function") {
        throw new Error(`spire_module_api_invalid:${module.packageName}`);
      }

      app.register(plugin, {
        prefix: module.api?.prefix || `/api/${module.id}`,
        spireModule: module,
      });

      app.log.info({ module: module.id, version: module.version }, "module API registered");
    } catch (error) {
      if (module.api?.optional && missingOptionalSubpath(error, module.packageName, "/api")) {
        continue;
      }
      throw error;
    }
  }

  return modules;
}

export async function loadInstalledEventModules({ events, logger = console } = {}) {
  const modules = await discoverInstalledModules();

  for (const module of modules) {
    try {
      const imported = await import(`${module.packageName}/events`);
      const register = imported.default || imported.registerEvents;
      if (typeof register !== "function") {
        throw new Error(`spire_module_events_invalid:${module.packageName}`);
      }

      await register({ events, module });
      logger?.info?.({ module: module.id, version: module.version }, "module event subscribers registered");
    } catch (error) {
      if (missingOptionalSubpath(error, module.packageName, "/events")) continue;
      throw error;
    }
  }

  return modules;
}
