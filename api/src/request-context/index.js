import { AsyncLocalStorage } from "node:async_hooks";

const storage = new AsyncLocalStorage();

export function runWithRequestContext(context, callback) {
  return storage.run(context, callback);
}

export function getRequestContext() {
  return storage.getStore() || null;
}

export function patchRequestContext(patch = {}) {
  const context = getRequestContext();
  if (!context) return null;
  Object.assign(context, patch);
  return context;
}
