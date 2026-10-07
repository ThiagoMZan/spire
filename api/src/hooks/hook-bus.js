import { randomUUID } from "node:crypto";

export function createHookBus({ logger = console } = {}) {
  const listeners = new Map();
  let order = 0;

  function sorted(eventName) {
    return [...(listeners.get(eventName) || [])].sort(
      (a, b) => a.priority - b.priority || a.order - b.order,
    );
  }

  function on(eventName, handler, options = {}) {
    if (!eventName || typeof handler !== "function") {
      throw new Error("hook_registration_invalid");
    }

    const entry = {
      token: randomUUID(),
      handler,
      moduleKey: options.moduleKey || null,
      source: options.source || null,
      priority: Number.isFinite(options.priority) ? options.priority : 100,
      once: Boolean(options.once),
      order: order++,
    };

    const current = listeners.get(eventName) || [];
    current.push(entry);
    listeners.set(eventName, current);

    const unsubscribe = () => off(eventName, entry.token);
    unsubscribe.token = entry.token;
    return unsubscribe;
  }

  function once(eventName, handler, options = {}) {
    return on(eventName, handler, { ...options, once: true });
  }

  function off(eventName, tokenOrHandler) {
    const current = listeners.get(eventName) || [];
    if (!tokenOrHandler) {
      listeners.delete(eventName);
      return current.length;
    }

    const next = current.filter(
      (entry) => entry.token !== tokenOrHandler && entry.handler !== tokenOrHandler,
    );

    if (next.length) listeners.set(eventName, next);
    else listeners.delete(eventName);

    return current.length - next.length;
  }

  function offByModule(moduleKey) {
    let removed = 0;
    for (const [eventName, current] of listeners.entries()) {
      const next = current.filter((entry) => entry.moduleKey !== moduleKey);
      removed += current.length - next.length;
      if (next.length) listeners.set(eventName, next);
      else listeners.delete(eventName);
    }
    return removed;
  }

  async function trigger(eventName, payload, meta = {}) {
    for (const entry of sorted(eventName)) {
      await entry.handler(payload, meta);
      if (entry.once) off(eventName, entry.token);
    }
    return payload;
  }

  function emit(eventName, payload, meta = {}) {
    queueMicrotask(async () => {
      try {
        await trigger(eventName, payload, meta);
      } catch (error) {
        logger?.error?.({ error, eventName }, "hook emit failed");
      }
    });
  }

  return { on, once, off, offByModule, trigger, emit };
}
