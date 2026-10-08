# Users and sessions

Authentication infrastructure belongs to the kernel. Roles and permissions are deferred.

## Configuration

Environment configuration is loaded at process startup. Restart every API/worker instance after changes and use the same values across instances.

| Variable | Default | Meaning |
| --- | --- | --- |
| `AUTH_MAX_SESSIONS_PER_USER` | `1` | Maximum concurrent valid sessions per user. |
| `AUTH_SESSION_IDLE_TIMEOUT_SECONDS` | `1800` | Expiration after 30 minutes without activity. |
| `AUTH_SESSION_MAX_AGE_SECONDS` | `86400` | Absolute lifetime of 24 hours, even with activity. |

All three values must be positive integers. The idle timeout and absolute lifetime are independent; whichever expires first ends the session.

New logins must revoke the oldest valid sessions as necessary to respect the limit. Lock the user row and perform revocation and session creation in the same transaction to serialize concurrent logins. A changed limit takes effect on the next login.

Store the absolute expiration in `expires_at` when creating a session. Changes to maximum age affect new sessions. Evaluate inactivity using `last_seen_at` and the current idle timeout, so idle timeout changes affect existing sessions after restart.

## Database

`kernel.user` represents a login account, separate from business person records. Email must be trimmed and lowercase before persistence and login lookup. The database enforces normalization and uniqueness. Store only a password hash. `disabled_at` blocks access without deleting the account. Application writes must maintain `updated_at`.

`kernel.session` stores one row per login. Send an unpredictable random token in an HttpOnly cookie and persist only its hash in `token_hash`. Never return password or token hashes in API responses.

Session validation must check revocation, absolute expiration, inactivity and the user's disabled status. Successful authenticated activity must maintain `last_seen_at`. Logout sets `revoked_at`; password changes should revoke other sessions. The database index supports listing unrevoked sessions, but callers must also filter expired and idle sessions.

## Current scope

Implemented: email/password login, current user, logout, scrypt password verification, HttpOnly cookies, PostgreSQL sessions, concurrent session limits, absolute and idle expiration, disabled-account rejection and login attempt limits.

Endpoints: `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`. Login accepts `email` and `password`; responses expose only id, email and displayName. Use `app.requireUser` as a Fastify preHandler to protect module routes and `getRequestContext().principal` to read the authenticated identity.

State-changing API requests require `Origin` matching `CORS_ORIGIN` and the header `X-Spire-Request: 1`. Set CORS_ORIGIN to the actual browser frontend origin, including when Fastify serves the production build. Production cookies are Secure and require HTTPS.

Login permits 10 attempts per source IP in a 15-minute window, backed by kernel.login_limit; all login attempts count. Reverse proxy deployments need trusted proxy configuration and upstream rate limits because the default Fastify request IP is the direct peer. Expired counter rows can be removed periodically; counters do not reset on restart.

The web host uses Naive UI, a shared theme and Brazilian Portuguese providers. Frontend module packages should declare compatible Vue and Naive UI peer dependencies. Routes require a valid session; navigation and returning to a tab refresh the user. There is no background heartbeat that keeps idle sessions alive.

Roles, password changes/recovery, registration and administrative user creation tooling remain deferred.

Run unit checks with `npm test`. For PostgreSQL integration checks in PowerShell: `$env:SPIRE_AUTH_INTEGRATION='1'; npm.cmd test`. Integration checks create and remove a temporary account.

Apply the additive bootstrap to a local development database with `npm run db:init`, then generate the database contract with `npm run db:contract:generate`. The bootstrap is not a production migration; existing production databases need a controlled migration. Generated contracts must come from PostgreSQL introspection, never manual edits.
