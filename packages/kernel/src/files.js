import { getKernelRuntime } from "./runtime.js";

export const files = {
  save: (...args) => getKernelRuntime().files.save(...args),
  metadata: (...args) => getKernelRuntime().files.metadata(...args),
  read: (...args) => getKernelRuntime().files.read(...args),
  remove: (...args) => getKernelRuntime().files.remove(...args),
};
