import { getKernelRuntime } from "./runtime.js";

export const hooks = {
  on: (...args) => getKernelRuntime().hooks.on(...args),
  once: (...args) => getKernelRuntime().hooks.once(...args),
  off: (...args) => getKernelRuntime().hooks.off(...args),
  trigger: (...args) => getKernelRuntime().hooks.trigger(...args),
  emit: (...args) => getKernelRuntime().hooks.emit(...args),
};
