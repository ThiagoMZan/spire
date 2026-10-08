import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { hashPassword, verifyPassword } from "./password.js";
import { createDb } from "../database/knex.js";
import { config } from "../config.js";
import { buildApp } from "../app.js";
import { getRequestContext } from "../request-context/index.js";
import { authRequest } from "../../../web/src/auth.js";

test("scrypt accepts the correct password and rejects incorrect or malformed hashes", async () => {
  const hash = await hashPassword("test-password");
  assert.equal(await verifyPassword("test-password", hash), true);
  assert.equal(await verifyPassword("wrong", hash), false);
  assert.equal(await verifyPassword("test-password", "invalid"), false);
});

// Opt-in: needs an initialized PostgreSQL database; creates and removes its own account.
test("authentication HTTP flow and durable session policies", { skip: process.env.SPIRE_AUTH_INTEGRATION !== "1" }, async (t) => {
  const db = createDb();
  const app = await buildApp();
  const id = randomUUID();
  const email = `test-${id}@spire.local`;
  const ip = "198.51.100.241";
  const rateIp = "198.51.100.242";
  const headers = { origin: config.CORS_ORIGIN, "x-spire-request": "1" };
  const rateKeys = [ip, rateIp].map((value) => createHash("sha256").update(value).digest("hex"));
  const login = (password = "test-password", overrides = {}) => app.inject({
    method: "POST", url: "/api/auth/login", remoteAddress: ip, headers, payload: { email, password }, ...overrides,
  });
  const me = (cookie) => app.inject({ method: "GET", url: "/api/auth/me", headers: { cookie } });
  const cookieFrom = (response) => response.headers["set-cookie"].split(";")[0];
  app.get("/api/test/principal", { preHandler: app.requireUser }, async () => ({ user: getRequestContext()?.principal }));
  try {
    await db("kernel.login_limit").whereIn("key", rateKeys).del();
    await db("kernel.user").insert({ id, email, display_name: "Test", password_hash: await hashPassword("test-password") });
    assert.equal((await me("")).statusCode, 401);
    assert.equal((await app.inject({ url: "/api/kernel/modules" })).statusCode, 401);
    assert.equal((await login("test-password", { headers: {} })).statusCode, 403);
    assert.equal((await login("test-password", { headers: { ...headers, origin: "https://untrusted.example" } })).statusCode, 403);
    assert.equal((await login("wrong")).statusCode, 401);
    assert.equal((await login("test-password", { payload: { email: "missing@spire.local", password: "test-password" } })).statusCode, 401);
    const first = await login("test-password", { payload: { email: " " + email.toUpperCase() + " ", password: "test-password" } });
    assert.equal(first.statusCode, 200);
    assert.match(first.headers["set-cookie"], /HttpOnly/);
    assert.match(first.headers["set-cookie"], /SameSite=Lax/i);
    assert.equal(first.json().user.password_hash, undefined);
    const firstCookie = cookieFrom(first);
    assert.equal((await me(firstCookie)).json().user.id, id);
    assert.equal((await app.inject({ url: "/api/test/principal", headers: { cookie: firstCookie } })).json().user.id, id);
    const parallel = await Promise.all([login(), login()]);
    assert.ok(parallel.every((response) => response.statusCode === 200));
    assert.equal((await me(firstCookie)).statusCode, config.AUTH_MAX_SESSIONS_PER_USER === 1 ? 401 : 200);
    const active = await db("kernel.session").where({ user_id: id }).whereNull("revoked_at");
    assert.equal(active.length, Math.min(3, config.AUTH_MAX_SESSIONS_PER_USER));
    const cookies = parallel.map(cookieFrom);
    let currentCookie;
    for (const cookie of cookies) if ((await me(cookie)).statusCode === 200) currentCookie = cookie;
    assert.ok(currentCookie);
    const tokenHash = createHash("sha256").update(currentCookie.split("=")[1]).digest("hex");
    const session = await db("kernel.session").where({ token_hash: tokenHash }).first();
    assert.notEqual(session.token_hash, currentCookie.split("=")[1]);
    await db("kernel.user").where({ id }).update({ disabled_at: new Date() });
    assert.equal((await me(currentCookie)).statusCode, 401);
    await db("kernel.user").where({ id }).update({ disabled_at: null });
    const old = new Date(Date.now() - (config.AUTH_SESSION_IDLE_TIMEOUT_SECONDS + 60) * 1000);
    await db("kernel.session").where({ id: session.id }).update({ created_at: old, last_seen_at: old });
    assert.equal((await me(currentCookie)).statusCode, 401);
    const fresh = await login();
    const freshCookie = cookieFrom(fresh);
    const freshHash = createHash("sha256").update(freshCookie.split("=")[1]).digest("hex");
    await db("kernel.session").where({ token_hash: freshHash }).update({
      created_at: new Date(Date.now() - 120000), expires_at: new Date(Date.now() - 60000),
    });
    assert.equal((await me(freshCookie)).statusCode, 401);
    const logoutCookie = cookieFrom(await login());
    t.mock.method(globalThis, "fetch", async (url, options) => {
      const response = await app.inject({
        method: options.method, url,
        headers: { ...options.headers, origin: config.CORS_ORIGIN, cookie: logoutCookie },
        payload: options.body,
      });
      assert.equal(response.statusCode, 204);
      assert.match(response.headers["set-cookie"], /spire_session=;/);
      return new Response(null, { status: response.statusCode });
    });
    assert.equal(await authRequest("logout", { method: "POST" }), null);
    assert.equal((await me(logoutCookie)).statusCode, 401);
    for (let i = 0; i < 10; i++) assert.equal((await login("wrong", { remoteAddress: rateIp })).statusCode, 401);
    assert.equal((await login("wrong", { remoteAddress: rateIp })).statusCode, 429);
  } finally {
    await db("kernel.session").where({ user_id: id }).del();
    await db("kernel.user").where({ id }).del();
    await db("kernel.login_limit").whereIn("key", rateKeys).del();
    await app.close();
    await db.destroy();
  }
});
