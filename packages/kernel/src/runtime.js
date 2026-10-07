let runtime = null;

export function initializeKernelRuntime(services) {
  runtime = { ...(runtime || {}), ...services };
  return runtime;
}

export function getKernelRuntime() {
  if (!runtime) throw new Error("spire_kernel_runtime_not_initialized");
  return runtime;
}
