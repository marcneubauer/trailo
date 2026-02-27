# Trailo — Authentication Specification

## Overview

Trailo supports two authentication methods:
1. **Password** — email + password registration and login (primary)
2. **Passkeys** — WebAuthn/FIDO2 passwordless authentication (optional, added to existing account)

Sessions are managed via database-backed cookies.

## Session Management

### Cookie Configuration

| Property | Value |
|----------|-------|
| Name | `trailo_session` |
| HttpOnly | true |
| Secure | true in production, false in dev |
| SameSite | Lax |
| Path | / |
| Max-Age | 30 days (2592000 seconds) |

### Session Lifecycle

1. **Creation**: On successful registration or login, a new session row is created in the `sessions` table with a 30-day expiry. The session ID is set as the cookie value.
2. **Validation**: On each authenticated request, the auth plugin reads the `trailo_session` cookie, looks up the session in the database, and checks expiry. If valid, `request.user` is decorated with the user object.
3. **Sliding expiry**: On each valid request, the session's `expires_at` is extended by 30 days from now.
4. **Revocation**: On logout, the session row is deleted and the cookie is cleared.
5. **Cleanup**: Expired sessions can be cleaned up periodically (cron or on-demand).

### Auth Plugin (Fastify)

The auth plugin is a Fastify decorator that:
1. Reads `trailo_session` from cookies
2. Queries `sessions` JOIN `users` to get user data
3. Rejects with 401 if session is missing, expired, or invalid
4. Decorates `request.user` with `{ id, email, username }`
5. Refreshes session expiry

Routes opt into auth by registering the plugin or calling a preHandler hook.

---

## Password Registration Flow

```
Client                        Server
  │                              │
  ├── POST /auth/register ──────→│
  │   { email, username,         │── Validate input (Zod)
  │     password }               │── Check email/username uniqueness
  │                              │── Hash password (argon2id)
  │                              │── Create user row
  │                              │── Create session row
  │◄── 201 { user } ────────────│── Set trailo_session cookie
  │    + Set-Cookie              │
```

### Password Hashing

- Algorithm: **argon2id** (via the `argon2` npm package)
- Uses library defaults (memory: 65536 KB, iterations: 3, parallelism: 4)
- No manual salt management (argon2 handles this internally)

### Validation Rules

| Field | Rules |
|-------|-------|
| email | Valid email format, max 255 chars, lowercase trimmed |
| username | 3-30 chars, `/^[a-zA-Z0-9_-]+$/`, trimmed |
| password | 8-128 chars |

---

## Password Login Flow

```
Client                        Server
  │                              │
  ├── POST /auth/login ─────────→│
  │   { email, password }        │── Look up user by email
  │                              │── Verify password (argon2.verify)
  │                              │── Create session row
  │◄── 200 { user } ────────────│── Set trailo_session cookie
  │    + Set-Cookie              │
```

- Returns `401 UNAUTHORIZED` with generic "Invalid email or password" message (no user enumeration)
- Rate limiting: future enhancement (not in v1)

---

## Passkey Registration Flow

Passkeys are added to an existing authenticated account (e.g., after password registration).

```
Client                           Server
  │                                 │
  ├── POST /passkey/register/       │
  │   options ─────────────────────→│
  │                                 │── generateRegistrationOptions()
  │                                 │── Store challenge in session
  │◄── 200 { options } ────────────│
  │                                 │
  │── startRegistration(options)    │
  │   (browser WebAuthn prompt)     │
  │                                 │
  ├── POST /passkey/register/       │
  │   verify ──────────────────────→│
  │   { attestation response }      │── Retrieve challenge from session
  │                                 │── verifyRegistrationResponse()
  │                                 │── Store credential in DB
  │◄── 200 { verified: true } ─────│
```

### Registration Options Configuration

```typescript
generateRegistrationOptions({
  rpName: config.rp.name,           // "Trailo"
  rpID: config.rp.id,               // "localhost" or domain
  userID: isoUint8Array(user.id),
  userName: user.email,
  userDisplayName: user.username,
  attestationType: 'none',          // No attestation needed for personal use
  excludeCredentials: existingCreds, // Prevent duplicate registrations
  authenticatorSelection: {
    residentKey: 'preferred',        // Allow discoverable credentials
    userVerification: 'preferred',
  },
})
```

---

## Passkey Login Flow

```
Client                           Server
  │                                 │
  ├── POST /passkey/login/          │
  │   options ─────────────────────→│
  │   { email? }                    │── generateAuthenticationOptions()
  │                                 │── Store challenge in temp cookie
  │◄── 200 { options } ────────────│
  │                                 │
  │── startAuthentication(options)  │
  │   (browser WebAuthn prompt)     │
  │                                 │
  ├── POST /passkey/login/          │
  │   verify ──────────────────────→│
  │   { assertion response }        │── Retrieve challenge from cookie
  │                                 │── Look up credential by ID
  │                                 │── verifyAuthenticationResponse()
  │                                 │── Update credential counter
  │                                 │── Create session
  │◄── 200 { user } ───────────────│── Set trailo_session cookie
  │    + Set-Cookie                 │
```

### Challenge Storage for Login

Since passkey login does not require an existing session, the challenge is stored in a short-lived, HttpOnly cookie (`trailo_webauthn_challenge`) with a 5-minute expiry.

---

## Security Considerations

1. **No user enumeration**: Login errors use generic messages. Registration checks for existing email/username return the same error shape.
2. **Password hashing**: argon2id with strong defaults. Password is never stored in plaintext or logged.
3. **Session cookie security**: HttpOnly prevents XSS access. SameSite=Lax prevents CSRF for state-changing requests.
4. **WebAuthn origin validation**: The server verifies that the origin in the WebAuthn response matches `config.rp.origin`.
5. **Credential counter**: Updated on each passkey authentication to detect cloned authenticators.
