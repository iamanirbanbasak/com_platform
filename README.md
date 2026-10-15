# Clubhouse

A platform for an organisation's clubs:

- **Admin** (one account): creates, archives and deletes clubs, appoints presidents, bans or
  deletes users, revokes any invite and moderates all posts, events and photos.
- **Club presidents**: manage their club's profile, posts (public or members-only), events and
  photo gallery, and admit **official members** with single-use invite codes or links that
  expire after 7 days.
- **Official members**: join through an invite, appear on the club roster and can read
  members-only posts.
- **Followers / visitors**: browse every club and event; with an account they follow clubs
  and get a personal feed.

Built with Next.js 16 (App Router, Server Actions), Better Auth, Prisma 7 + PostgreSQL,
Tailwind CSS 4, Vercel Blob and Resend.

## Local setup

Requirements: Node 20+, pnpm, PostgreSQL 14+.

```bash
pnpm install
cp .env.example .env               # then fill in the values (see below)
createdb club_platform
pnpm db:migrate                    # create the schema
pnpm db:seed                       # create the admin account from ADMIN_EMAIL / ADMIN_PASSWORD
pnpm dev                           # http://localhost:3000
```

Sign in with the admin email and password, open **Admin console** from the account menu,
create a club and enter the president's email (they must have signed up first).

Without the optional keys the app still runs locally: emails (verification, password reset)
are printed to the terminal, the Google button is hidden, and uploads are saved to
`public/uploads`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string (Neon in production) |
| `BETTER_AUTH_SECRET` | yes | Session signing secret: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | yes | Public site URL, used for auth callbacks and invite links |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | for seeding | The single admin account |
| `NEXT_PUBLIC_APP_TIMEZONE` | recommended | IANA zone events are entered and shown in, e.g. `Asia/Kolkata` |
| `NEXT_PUBLIC_SITE_NAME` | no | Name in the header and page titles (default `Clubhouse`) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | no | Google sign-in; redirect URI is `<BETTER_AUTH_URL>/api/auth/callback/google` |
| `RESEND_API_KEY`, `EMAIL_FROM` | production | Sends verification and password-reset emails |
| `BLOB_READ_WRITE_TOKEN` | production | Vercel Blob storage for logos, covers and gallery photos |

## Deploying to Vercel

1. Create a Postgres database (Neon via the Vercel marketplace works) and a Vercel Blob store.
2. Set all variables above in the Vercel project. `BLOB_READ_WRITE_TOKEN` is **required** in
   production: local-disk uploads only work in development.
3. Run migrations and the seed against the production database once:
   `pnpm db:deploy && pnpm db:seed` (with production env vars loaded).
4. Deploy. `pnpm build` runs `prisma generate` first.

## How invites work

A president clicks **Generate invite** on `/manage/<club>/invites` and gets a code like
`M3PU-KBHZ-9R` plus a link `/join/M3PU-KBHZ-9R`. Codes use a crypto-random 10-character
alphabet without look-alike characters. Each code admits one person, expires after 7 days and
can be revoked while unused. Redemption claims the code with a conditional update inside a
transaction, so two people racing for the same code can't both join.

## Project layout

```
src/server/      business logic: one module per domain, every function checks permissions
src/app/         routes; actions.ts files are thin Server Actions (validate, call service)
src/components/  UI components
src/lib/         auth, database, env, validation and date helpers
prisma/          schema, migrations, admin seed
tests/           Vitest integration tests (real Postgres) and Playwright e2e
```

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm test` | Integration tests against `club_platform_test` (see `.env.test`) |
| `pnpm test:e2e` | Browser tests against `club_platform_e2e` (see `.env.e2e`) |
| `pnpm typecheck` / `pnpm lint` / `pnpm format` | Static checks and formatting |
| `pnpm db:migrate` / `pnpm db:deploy` | Create a migration in dev / apply migrations |
| `pnpm db:seed` | Create or repair the admin account |
| `pnpm auth:generate` | Regenerate Better Auth's tables in the Prisma schema |

Test databases need creating once: `createdb club_platform_test && createdb club_platform_e2e`.
`.env.test` and `.env.e2e` are git-ignored; copy `.env.example`, point `DATABASE_URL` at the
test database, and for e2e also set `BETTER_AUTH_URL="http://localhost:3100"`,
`REQUIRE_EMAIL_VERIFICATION="false"`, `ADMIN_EMAIL="admin@e2e.test"` and
`ADMIN_PASSWORD="admin-e2e-password"`.
