import { getKernelRuntime } from "./runtime.js";

export const events = {
  on: (...args) => getKernelRuntime().events.on(...args),
  publish: (...args) => getKernelRuntime().events.publish(...args),
};
