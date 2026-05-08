# Admin Invitation System

## Overview

Admin-only invitation flow built on Cloudflare Workers + KV + D1 + Resend.

---

## Flow Summary

### Admin side
1. Admin calls `POST /invites/create` with `{ email, role }`
2. Worker generates a `crypto.randomUUID()` token
3. Two KV keys stored with 48h TTL:
   - `invite:token:{token}` → full invite payload
   - `invite:email:{email}` → token (prevents duplicates)
4. Resend delivers invite email with link containing token

### Invitee side
1. Invitee clicks `/accept-invite?token=…`
2. Worker looks up `invite:token:{token}` in KV
3. Validates token exists and is not expired
4. Creates user in D1, deletes both KV keys (single-use)
5. Issues JWT as HttpOnly cookie → user is logged in

---

## Security Rules

- Admin JWT required to create invite
- Single-use token — deleted on acceptance
- 48h TTL hard expiry (KV enforced)
- Duplicate invite prevention via `invite:email:{email}` key
- Race condition guard: checks D1 for existing user before insert
- Revoke endpoint available for admins

---

## Invite Route (`apps/api/src/routes/invites.ts`)

```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth, requireAdmin } from '../middleware/auth'
import { sendInviteEmail } from '../lib/email'
import { drizzle } from 'drizzle-orm/d1'
import { users } from '../db/schema'

const invites = new Hono<{ Bindings: Env }>()

// ── Create invite (admin only) ──────────────────────────────────────
invites.post(
  '/create',
  requireAuth,
  requireAdmin,
  zValidator('json', z.object({
    email: z.string().email(),
    role: z.enum(['admin', 'member']).default('member'),
  })),
  async (c) => {
    const { email, role } = c.req.valid('json')
    const admin = c.get('user')

    const db = drizzle(c.env.DB)
    const existing = await db.select().from(users)
      .where(eq(users.email, email)).get()
    if (existing) {
      return c.json({ error: 'Email already registered' }, 409)
    }

    const existingInvite = await c.env.KV.get(`invite:email:${email}`)
    if (existingInvite) {
      return c.json({ error: 'Invite already pending for this email' }, 409)
    }

    const token = crypto.randomUUID()
    const payload = JSON.stringify({
      email,
      role,
      invitedBy: admin.id,
      createdAt: Date.now(),
    })

    await Promise.all([
      c.env.KV.put(`invite:token:${token}`, payload, { expirationTtl: 172800 }),
      c.env.KV.put(`invite:email:${email}`, token,   { expirationTtl: 172800 }),
    ])

    await sendInviteEmail({
      to: email,
      invitedByEmail: admin.email,
      inviteUrl: `${c.env.APP_URL}/accept-invite?token=${token}`,
      resendKey: c.env.RESEND_API_KEY,
    })

    return c.json({ success: true })
  }
)

// ── Accept invite ───────────────────────────────────────────────────
invites.post(
  '/accept',
  zValidator('json', z.object({
    token: z.string().uuid(),
    name: z.string().min(1).max(100).optional(),
  })),
  async (c) => {
    const { token, name } = c.req.valid('json')

    const raw = await c.env.KV.get(`invite:token:${token}`)
    if (!raw) {
      return c.json({ error: 'Invite not found or expired' }, 404)
    }

    const invite = JSON.parse(raw) as {
      email: string
      role: 'admin' | 'member'
      invitedBy: string
      createdAt: number
    }

    const db = drizzle(c.env.DB)

    const existing = await db.select().from(users)
      .where(eq(users.email, invite.email)).get()
    if (existing) {
      await c.env.KV.delete(`invite:token:${token}`)
      return c.json({ error: 'Email already registered' }, 409)
    }

    const userId = crypto.randomUUID()
    await db.insert(users).values({
      id: userId,
      email: invite.email,
      name: name ?? null,
      role: invite.role,
      invitedBy: invite.invitedBy,
    })

    await Promise.all([
      c.env.KV.delete(`invite:token:${token}`),
      c.env.KV.delete(`invite:email:${invite.email}`),
    ])

    const jwt = await signJwt({ sub: userId, role: invite.role }, c.env.JWT_SECRET)
    setCookie(c, 'session', jwt, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return c.json({ success: true, user: { id: userId, email: invite.email, role: invite.role } })
  }
)

// ── Revoke invite (admin only) ──────────────────────────────────────
invites.delete(
  '/revoke',
  requireAuth,
  requireAdmin,
  zValidator('json', z.object({ email: z.string().email() })),
  async (c) => {
    const { email } = c.req.valid('json')

    const token = await c.env.KV.get(`invite:email:${email}`)
    if (!token) {
      return c.json({ error: 'No pending invite for this email' }, 404)
    }

    await Promise.all([
      c.env.KV.delete(`invite:token:${token}`),
      c.env.KV.delete(`invite:email:${email}`),
    ])

    return c.json({ success: true })
  }
)

export default invites
```

---

## Email Template (`apps/api/src/lib/email.ts`)

```typescript
export async function sendInviteEmail({
  to,
  invitedByEmail,
  inviteUrl,
  resendKey,
}: {
  to: string
  invitedByEmail: string
  inviteUrl: string
  resendKey: string
}) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Your App <noreply@yourapp.com>',
      to,
      subject: `${invitedByEmail} invited you to Your App`,
      html: `
        <p>Hi,</p>
        <p>${invitedByEmail} has invited you to join Your App.</p>
        <p>
          <a href="${inviteUrl}"
             style="background:#4f46e5;color:white;padding:12px 24px;
                    border-radius:6px;text-decoration:none;display:inline-block">
            Accept invitation
          </a>
        </p>
        <p style="color:#6b7280;font-size:14px">
          This link expires in 48 hours. If you did not expect this invitation,
          you can safely ignore this email.
        </p>
      `,
    }),
  })
}
```

---

## Auth Middleware (`apps/api/src/middleware/auth.ts`)

```typescript
import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { verifyJwt } from '../lib/jwt'

export const requireAuth = createMiddleware(async (c, next) => {
  const token = getCookie(c, 'session')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  const payload = await verifyJwt(token, c.env.JWT_SECRET)
  if (!payload) return c.json({ error: 'Invalid session' }, 401)

  c.set('user', payload)
  await next()
})

export const requireAdmin = createMiddleware(async (c, next) => {
  const user = c.get('user')
  if (user?.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)
  await next()
})
```

---

## D1 Schema (`apps/api/src/db/schema.ts`)

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id:        text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email:     text('email').notNull().unique(),
  name:      text('name'),
  role:      text('role', { enum: ['admin', 'member'] }).notNull().default('member'),
  invitedBy: text('invited_by'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Permanent audit log — separate from ephemeral KV tokens
export const inviteLog = sqliteTable('invite_log', {
  id:         text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email:      text('email').notNull(),
  invitedBy:  text('invited_by').notNull().references(() => users.id),
  acceptedAt: integer('accepted_at', { mode: 'timestamp' }),
  revokedAt:  integer('revoked_at',  { mode: 'timestamp' }),
  createdAt:  integer('created_at',  { mode: 'timestamp' }).$defaultFn(() => new Date()),
})
```

---

## KV Key Design

| Key | Value | TTL | Purpose |
|-----|-------|-----|---------|
| `invite:token:{uuid}` | `{ email, role, invitedBy, createdAt }` | 48h | Lookup by invitee |
| `invite:email:{email}` | `{uuid}` | 48h | Prevent duplicate invites |

Both keys are deleted together on acceptance or revocation.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/invites/create` | Admin JWT | Create and send invite |
| `POST` | `/invites/accept` | None | Accept invite, create user, issue JWT |
| `DELETE` | `/invites/revoke` | Admin JWT | Revoke pending invite |

---

## Environment Variables Required

```
# wrangler.toml bindings
DB          → Cloudflare D1 database
KV          → Cloudflare KV namespace
APP_URL     → https://yourapp.vercel.app

# wrangler secrets (set via: wrangler secret put KEY)
JWT_SECRET       → min 32 char random string
RESEND_API_KEY   → re_xxxx from resend.com
```

---

## Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: Cloudflare D1 (SQLite) via Drizzle ORM
- **Cache/tokens**: Cloudflare KV
- **Email**: Resend
- **Validation**: Zod
- **Auth**: JWT (HttpOnly cookie, 7-day expiry)
