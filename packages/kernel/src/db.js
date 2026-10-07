import { getKernelRuntime } from "./runtime.js";

export const db = new Proxy(function spireDb() {}, {
  apply(_target, thisArg, args) {
    return Reflect.apply(getKernelRuntime().db, thisArg, args);
  },
  get(_target, property) {
    const client = getKernelRuntime().db;
    const value = client[property];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
