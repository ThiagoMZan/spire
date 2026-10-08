import test from "node:test";
import assert from "node:assert/strict";
import { authRequest } from "./auth.js";

test("logout sends no JSON content type without a body", async (t) => {
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/auth/logout");
    assert.equal(options.method, "POST");
    assert.equal(options.headers["Content-Type"], undefined);
    assert.equal(options.headers["X-Spire-Request"], "1");
    assert.equal(options.credentials, "same-origin");
    return new Response(null, { status: 204 });
  });
  assert.equal(await authRequest("logout", { method: "POST" }), null);
});

test("login sends JSON content type with its credentials", async (t) => {
  const body = JSON.stringify({ email: "test@example.com", password: "test" });
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.equal(options.body, body);
    return Response.json({ user: { id: "test" } });
  });
  assert.deepEqual(await authRequest("login", { method: "POST", body }), { user: { id: "test" } });
});
