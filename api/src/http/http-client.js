export function createHttpClient({ logger = console, defaultTimeoutMs = 30000 } = {}) {
  async function request(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? defaultTimeoutMs);

    try {
      const headers = new Headers(options.headers || {});
      let body = options.body;

      if (body !== undefined && body !== null && typeof body === "object" &&
          !(body instanceof FormData) && !(body instanceof ArrayBuffer)) {
        headers.set("content-type", headers.get("content-type") || "application/json");
        body = JSON.stringify(body);
      }

      const response = await fetch(url, {
        ...options,
        body,
        headers,
        signal: controller.signal,
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        const error = new Error(`http_request_failed:${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      logger?.error?.({ error, url }, "http request failed");
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    request,
    get: (url, options = {}) => request(url, { ...options, method: "GET" }),
    post: (url, options = {}) => request(url, { ...options, method: "POST" }),
    put: (url, options = {}) => request(url, { ...options, method: "PUT" }),
    patch: (url, options = {}) => request(url, { ...options, method: "PATCH" }),
    delete: (url, options = {}) => request(url, { ...options, method: "DELETE" }),
  };
}
