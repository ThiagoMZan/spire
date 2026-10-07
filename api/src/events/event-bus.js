import { randomUUID } from "node:crypto";

export function createEventBus({ db, logger = console } = {}) {
  const subscribers = new Map();

  function on(eventName, subscriberKey, handler, options = {}) {
    if (!eventName || !subscriberKey || typeof handler !== "function") {
      throw new Error("event_subscription_invalid");
    }

    const current = subscribers.get(eventName) || [];
    if (current.some((entry) => entry.key === subscriberKey)) {
      throw new Error(`event_subscriber_already_registered:${subscriberKey}`);
    }

    current.push({
      key: subscriberKey,
      handler,
      moduleKey: options.moduleKey || null,
    });
    subscribers.set(eventName, current);

    return () => {
      subscribers.set(
        eventName,
        (subscribers.get(eventName) || []).filter((entry) => entry.key !== subscriberKey),
      );
    };
  }

  function getSubscriber(eventName, subscriberKey) {
    return (subscribers.get(eventName) || []).find(
      (entry) => entry.key === subscriberKey,
    ) || null;
  }

  function listSubscribers(eventName) {
    return [...(subscribers.get(eventName) || [])];
  }

  async function publish(eventName, payload = {}, options = {}) {
    if (!eventName) throw new Error("event_name_required");

    const client = options.trx || db;
    const eventId = randomUUID();
    const deliveries = listSubscribers(eventName);

    await client("kernel.event_outbox").insert({
      id: eventId,
      event_name: eventName,
      payload,
      metadata: options.metadata || {},
      source_module: options.sourceModule || null,
    });

    if (deliveries.length) {
      await client("kernel.event_delivery").insert(
        deliveries.map((subscriber) => ({
          id: randomUUID(),
          event_id: eventId,
          subscriber_key: subscriber.key,
          module_key: subscriber.moduleKey,
          status: "pending",
        })),
      );
    }

    logger?.debug?.({ eventId, eventName, deliveries: deliveries.length }, "event published");
    return { id: eventId, eventName, deliveries: deliveries.length };
  }

  return { on, publish, getSubscriber, listSubscribers };
}
