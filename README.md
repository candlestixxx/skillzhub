# SkillzHub

SkillzHub is a C2B marketplace for skilled GoPro and FPV footage used to
train AI models and robots. Companies post footage "missions"; creators
submit footage; admins review submissions in a QC queue.

Stack: Next.js 16 / React 19, Prisma (PostgreSQL), Redis + BullMQ worker,
NextAuth, Stripe, S3, Gemini. A Go microservice (`worker-go/`) handles
FFprobe metadata extraction.

## Status

**Maintenance-only.** Version 0.1.30. The last feature work landed
2026-09-15 (FFprobe metadata extraction ported to the Go microservice).
Since then the only activity has been automated dependency bumps
(dependabot), most recently 2026-11-12. No live deployment is evidenced
in the repo, and there are no paying users or customers on record.

## What's working

Per the repo's own docs and code:

- Company flow: create missions, view datasets (`/company`).
- Creator flow: view open missions, submit footage (`/creator`).
- Admin flow: review submissions in the QC queue (`/admin`).
- FFprobe metadata extraction via the Go worker.
- Unit tests (Vitest) and e2e tests (Playwright) exist in-repo.

## What's not working / not verified

- No production deployment is documented or verified.
- Payments (Stripe) and storage (S3) integrations are wired in code but
  no live transaction or deployment is on record.
- No feature development since 2026-09-15.

## Prerequisites

- Node.js >= 18
- Redis server running locally

## Quick Start

1. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Ensure Redis is running:
   ```bash
   redis-server &
   ```
3. Install dependencies and run migrations:
   ```bash
   npm install
   npx prisma migrate dev --name init
   npx tsx prisma/seed.ts
   ```
4. Start the development server and worker:
   ```bash
   # Terminal 1
   npm run build && npm start &

   # Terminal 2
   npx tsx worker.ts &
   ```

## Demo Walkthrough

Sign in at `/api/auth/signin`. Demo accounts (admin, company, creator)
are created by the seed script — see `prisma/seed.ts` for the credentials.

1. **Company flow:** log in as a company, visit `/company` to create
   missions and view datasets.
2. **Creator flow:** log in as a creator, visit `/creator` to view open
   missions and submit footage.
3. **Admin flow:** log in as admin, visit `/admin` to review submissions
   in the QC queue.

## Links

- Repo: https://github.com/candlestixxx/skillzhub
- Related docs in-repo: `CHANGELOG.md`, `ROADMAP.md`, `TODO.md`,
  `DEPLOY.md`, `LIBRARIES.md`, `docs/`
