import { getKernelRuntime } from "./runtime.js";

export function getRequestContext() {
  return getKernelRuntime().getRequestContext?.() || null;
}
