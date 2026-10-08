import { patchRequestContext } from "../request-context/index.js";
export async function registerAuth(app, { auth, config }) {
  const cookieName = "spire_session";
  const cookieOptions = { path: "/", httpOnly: true, sameSite: "lax", secure: config.NODE_ENV === "production" };
  app.decorateRequest("principal", null);
  app.addHook("onRequest", async (request, reply) => {
    if (!request.url.startsWith("/api/")) return;
    // Require a trusted origin and non-simple header for cookie-authenticated writes.
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && (request.headers.origin !== config.CORS_ORIGIN || request.headers["x-spire-request"] !== "1")) return reply.code(403).send({ error: "invalid_origin" });
    const resolved = await auth.resolve(request.cookies[cookieName]);
    request.principal = resolved?.user || null;
    patchRequestContext({ principal: request.principal });
  });
  const requireUser = async (request, reply) => {
    if (!request.principal) return reply.code(401).send({ error: "unauthenticated" });
  };
  app.decorate("requireUser", requireUser);
  app.addHook("onSend", async (request, reply, payload) => {
    if (request.url.startsWith("/api/auth/")) reply.header("Cache-Control", "no-store");
    return payload;
  });
  app.post("/api/auth/login", {
    schema: { body: { type: "object", additionalProperties: false, required: ["email", "password"], properties: {
      email: { type: "string", minLength: 1, maxLength: 320 }, password: { type: "string", minLength: 1, maxLength: 1024 },
    } } },
  }, async (request, reply) => {
    if (!(await auth.allowLogin(request.ip))) return reply.header("Retry-After", "900").code(429).send({ error: "too_many_attempts" });
    const result = await auth.login(request.body.email.trim().toLowerCase(), request.body.password);
    if (!result) return reply.code(401).send({ error: "invalid_credentials" });
    reply.setCookie(cookieName, result.token, { ...cookieOptions, expires: result.expiresAt });
    return { user: result.user };
  });
  app.get("/api/auth/me", { preHandler: requireUser }, async (request) => ({ user: request.principal }));
  app.post("/api/auth/logout", async (request, reply) => {
    await auth.logout(request.cookies[cookieName]);
    reply.clearCookie(cookieName, cookieOptions);
    return reply.code(204).send();
  });
}
