import { getKernelRuntime } from "./runtime.js";

export const logging = {
  debug: (...args) => getKernelRuntime().logging.debug(...args),
  info: (...args) => getKernelRuntime().logging.info(...args),
  warn: (...args) => getKernelRuntime().logging.warn(...args),
  error: (...args) => getKernelRuntime().logging.error(...args),
};
