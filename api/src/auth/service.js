import { createHash, randomBytes } from "node:crypto";
import { hashPassword, verifyPassword } from "./password.js";
const digest = (token) => createHash("sha256").update(token).digest("hex");
const publicUser = (user) => ({ id: user.id, email: user.email, displayName: user.display_name });
export async function createAuthService({ db, config }) {
  const dummyHash = await hashPassword(randomBytes(32).toString("hex"));
  function validSessions(query) {
    return query.whereNull("revoked_at").where("expires_at", ">", db.fn.now())
      .whereRaw("last_seen_at > now() - (? * interval '1 second')", [config.AUTH_SESSION_IDLE_TIMEOUT_SECONDS]);
  }
  return {
    async login(email, password) {
      const user = await db("kernel.user").where({ email }).first();
      const verified = await verifyPassword(password, user?.password_hash || dummyHash);
      if (!verified || !user || user.disabled_at) return null;
      return db.transaction(async (trx) => {
        const locked = await trx("kernel.user").where({ id: user.id }).forUpdate().first();
        if (locked.disabled_at || locked.password_hash !== user.password_hash) return null;
        const now = new Date();
        const sessions = await validSessions(trx("kernel.session").where({ user_id: user.id })).orderBy("created_at", "desc").orderBy("id", "desc");
        const revoke = sessions.slice(config.AUTH_MAX_SESSIONS_PER_USER - 1).map((session) => session.id);
        if (revoke.length) await trx("kernel.session").whereIn("id", revoke).update({ revoked_at: now });
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(now.getTime() + config.AUTH_SESSION_MAX_AGE_SECONDS * 1000);
        await trx("kernel.session").insert({ user_id: user.id, token_hash: digest(token), created_at: now, last_seen_at: now, expires_at: expiresAt });
        return { user: publicUser(locked), token, expiresAt };
      });
    },
    async resolve(token) {
      if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
      const [session] = await validSessions(db("kernel.session").where({ token_hash: digest(token) })).update({ last_seen_at: db.fn.now() }).returning(["id", "user_id"]);
      if (!session) return null;
      const user = await db("kernel.user").where({ id: session.user_id }).whereNull("disabled_at").first();
      return user ? { user: publicUser(user), sessionId: session.id } : null;
    },
    async logout(token) {
      if (token && /^[a-f0-9]{64}$/.test(token)) await db("kernel.session").where({ token_hash: digest(token) }).whereNull("revoked_at").update({ revoked_at: db.fn.now() });
    },
    async allowLogin(ip) {
      const result = await db.raw(`INSERT INTO kernel.login_limit (key, attempts, window_started_at)
        VALUES (?, 1, now()) ON CONFLICT (key) DO UPDATE SET
        attempts = CASE WHEN kernel.login_limit.window_started_at <= now() - interval '15 minutes' THEN 1 ELSE kernel.login_limit.attempts + 1 END,
        window_started_at = CASE WHEN kernel.login_limit.window_started_at <= now() - interval '15 minutes' THEN now() ELSE kernel.login_limit.window_started_at END
        RETURNING attempts`, [digest(ip)]);
      return result.rows[0].attempts <= 10;
    },
  };
}
