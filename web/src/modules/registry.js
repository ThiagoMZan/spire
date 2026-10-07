import { installedWebModules } from "../generated/modules.js";

export function getInstalledWebModules() {
  return installedWebModules.filter(Boolean);
}

export function getModuleMenus() {
  return getInstalledWebModules()
    .flatMap((module) => module.menu || [])
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

export function getModuleRoutes() {
  return getInstalledWebModules().flatMap((module) =>
    (module.routes || []).map((route) => ({
      ...route,
      meta: { ...(route.meta || {}), spireModule: module.id },
    })),
  );
}
