# Club Platform — Design Spec

Date: 2026-10-15

## Purpose

A web platform hosting many clubs of one organisation. A single admin runs the platform, each club
has a president, presidents admit official members via random single-use invite codes/links, and
anyone can browse and follow clubs.

## Roles & permissions

| Role | How you get it | Can do |
|------|----------------|--------|
| Visitor | — | Browse clubs, public posts, events, galleries, rosters |
| Follower | Any signed-in user | Follow/unfollow clubs, personal `/feed` |
| Official member | Redeem an invite for a club | Member badge on roster, see `MEMBERS` posts of that club. Can be member of many clubs |
| President | Admin sets `Club.presidentId` | Manage club profile, posts, events, gallery; create/revoke invites; remove members |
| Admin | Seeded from env (`ADMIN_EMAIL`, `ADMIN_PASSWORD`), `User.role = ADMIN` | Everything: clubs CRUD/archive, assign presidents, moderate all content, ban/delete users, see all invites |

Authorization is enforced server-side in services; UI hiding is cosmetic only. Banned users cannot
sign in or act.

## Stack

- Next.js (App Router, TypeScript strict), Server Actions, Tailwind CSS v4, shadcn-style components
- Better Auth: email/password (with email verification + password reset) and Google OAuth
- Prisma + PostgreSQL (Neon in production, local Postgres in dev)
- Vercel Blob for images (5 MB max, image MIME types only); local-disk fallback in dev without token
- Resend for email; console fallback in dev without key
- Zod for input validation
- Vitest (integration tests against a real Postgres test DB), Playwright (e2e)

## Data model

- `User` (Better Auth core + `role: ADMIN | USER`, `banned: boolean`), `Session`, `Account`, `Verification`
- `Club`: id, slug (unique), name, description, category, logoUrl, coverUrl,
  status `ACTIVE | ARCHIVED`, presidentId → User (nullable), createdAt
- `Membership`: userId, clubId, joinedAt, inviteId (nullable); unique (userId, clubId)
- `Follow`: userId, clubId, createdAt; unique (userId, clubId)
- `Post`: clubId, authorId, title, body (markdown), visibility `PUBLIC | MEMBERS`, createdAt, updatedAt
- `Event`: clubId, title, description, startsAt, endsAt (nullable), venue, coverUrl
- `GalleryImage`: clubId, url, caption, uploadedById, createdAt
- `Invite`: code (unique), clubId, createdById, createdAt, expiresAt, usedById, usedAt, revokedAt

The president is derived from `Club.presidentId`, not a user role, so a user can preside over one
club while following others, and reassignment is a single field change.

## Invite flow

1. President clicks "Generate invite". Server creates a 10-char code from a crypto-random source
   over an unambiguous alphabet (no 0/O/1/I/L), formatted `XXXX-XXXX-XX`, expiring in 7 days.
   UI shows the code and the link `/join/<code>` with copy buttons.
2. Invitee opens the link or types the code at `/join`. Unauthenticated users are sent to sign-in
   with a callback back to the join page.
3. On "Accept", inside one DB transaction: atomically claim the invite with a conditional update
   (`usedAt IS NULL AND revokedAt IS NULL AND expiresAt > now()`), verify the club is `ACTIVE`
   and the user is not already a member, then create the `Membership`. Concurrent redemptions of
   the same code: exactly one succeeds.
4. Failures return a typed reason: `NOT_FOUND`, `EXPIRED`, `USED`, `REVOKED`, `CLUB_ARCHIVED`,
   `ALREADY_MEMBER`. An already-member check happens before claiming so the code is not burned.

Presidents can revoke unused invites. Admin sees all invites.

## Routes

- Public: `/`, `/clubs` (search + category filter), `/clubs/[slug]` (tabs: posts, events,
  members, gallery; follow button), `/events`
- Auth: `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`
- User: `/feed`, `/me`, `/join`, `/join/[code]`
- President: `/manage/[slug]` with sections overview, profile, posts, events, gallery, members,
  invites
- Admin: `/admin`, `/admin/clubs`, `/admin/users`, `/admin/invites`, `/admin/content`

## Code structure

- `src/server/<domain>.ts` services: plain functions taking an `Actor` (current user) and returning
  `Result<T, DomainError>` for expected failures. Guards: `requireUser`, `requireAdmin`,
  `canManageClub`.
- `src/app/**/actions.ts` Server Actions: parse with Zod, get session, call service, revalidate.
- `middleware.ts` only redirects unauthenticated users away from `/feed`, `/me`, `/manage`,
  `/admin`; real checks live in services/pages.

## Error handling

- Expected failures → `Result` → inline form errors / toasts.
- Unexpected errors → logged, route-segment `error.tsx`.
- Unknown or archived clubs → 404 (admin can still see archived clubs).

## Testing

- Vitest integration tests on services against a real Postgres test DB: invite lifecycle
  (create, redeem, expire, revoke, concurrent redemption), role permission checks, follow,
  membership removal, club admin operations.
- Playwright smoke e2e: browse + follow, president generates invite, member redeems, admin assigns
  president.

## Configuration

`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `BLOB_READ_WRITE_TOKEN`, `ADMIN_EMAIL`,
`ADMIN_PASSWORD`. Missing optional keys degrade gracefully (Google button hidden, emails logged to
console, uploads stored locally).

## Out of scope

Notifications, comments, event RSVPs, chat, multiple admins.
