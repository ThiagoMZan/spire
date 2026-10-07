import { getKernelRuntime } from "./runtime.js";

export const http = {
  request: (...args) => getKernelRuntime().http.request(...args),
  get: (...args) => getKernelRuntime().http.get(...args),
  post: (...args) => getKernelRuntime().http.post(...args),
  put: (...args) => getKernelRuntime().http.put(...args),
  patch: (...args) => getKernelRuntime().http.patch(...args),
  delete: (...args) => getKernelRuntime().http.delete(...args),
};
