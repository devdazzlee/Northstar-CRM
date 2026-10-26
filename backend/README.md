# Northstar CRM API

NestJS + Prisma + PostgreSQL (Neon) multi-tenant SaaS backend.

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm exec prisma db push
pnpm prisma:seed
pnpm start:dev
```

Optional Redis (BullMQ queues instead of inline jobs):

```bash
docker compose up -d redis
# set REDIS_URL=redis://localhost:6379 in .env
```

- API: `http://localhost:4000/api/v1`
- Swagger: `http://localhost:4000/docs`
- Demo org admin: `admin@demo-acme.com` / `Password123!`
- Platform admin: `platform@northstar.local` / `Password123!`

## What is included

| Area | Endpoints |
|------|-----------|
| Auth / Team | `/auth/*`, `/users/*` |
| Core CRM | `/contacts`, `/companies`, `/deals`, `/leads`, `/tasks` |
| Catalog domains | activities, calendar, support, commerce, engage, automation, ops, marketing… |
| Engines | `/engines/lead-scoring/run`, `/assignment/run`, `/automation/run`, approvals, campaigns send, sequences |
| Import / Dedupe | `/imports`, `/duplicates/*` |
| Uploads | `POST /documents/upload` (+ static `/uploads`) |
| Billing | `/billing`, `/billing/upgrade` |
| Platform | `/platform/*` (PLATFORM_ADMIN only) |
| Extras | live-chat, enrichment, social, messaging, sandbox, marketplace, developer, language-settings, customer-360, leaderboards |
| Jobs | BullMQ when `REDIS_URL` set; otherwise inline processors |
| Reports | `/reports/dashboard|forecast|overview` (cached) |
| Recycle bin | `/recycle-bin` |

## Layering

```text
Request → Guard → Controller → Service → Repository → Prisma / Jobs
```

## Scripts

- `pnpm start:dev` — API watch mode
- `pnpm typecheck` / `pnpm test` / `pnpm test:e2e`
- `pnpm exec prisma db push` — sync schema (local/Neon)
- `pnpm prisma:migrate` — create/apply migrations when using migrate workflow
