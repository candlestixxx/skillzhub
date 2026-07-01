# SkillzHub - Development Roadmap

## Phase 1: Foundations & MVP Core (Completed)
- [x] Next.js 16 setup with App Router and Tailwind CSS
- [x] Prisma ORM and Postgres database schema
- [x] RBAC Authentication (NextAuth) for Creator, Company, Admin
- [x] Background job processing structure (BullMQ + Redis)
- [x] Rate Limiting (Redis Token Bucket)
- [x] Basic Test Coverage (Vitest for API routes)

## Phase 2: Core Platform Loops (Completed)
- [x] Mission Creation & Management API + UI (Company)
- [x] Submission Upload Flow & Queuing (Creator)
- [x] Admin Review Queue & QC Overrides (Admin)
- [x] Dataset auto-generation from accepted submissions
- [x] Dataset Manifest generation API
- [x] API Key generation and fast matching (SHA-256)

## Phase 3: Infrastructure Integration (Upcoming)
- [x] Implement actual AWS S3 / Cloudflare R2 presigned URLs in `src/lib/services/storage.ts`.
- [x] Implement actual Stripe Connect onboarding, account creation, and ledger transfers in `src/lib/services/payments.ts` and API routes.
- [x] Connect BullMQ `worker.ts` to real FFmpeg subprocesses for video normalization.
- [x] Integrate a real Vision-Language Model (VLM) (e.g., Gemini Flash or Qwen-VL) into the worker for auto-labeling (action summary, object tags).

## Phase 4: Polish, UI, and E2E Tests
- [x] Add Playwright for end-to-end user flow testing.
- [x] Build out real video playback interfaces for the Creator dashboard.
- [x] Improve Dataset Analytics dashboard with deeper aggregations.
- [x] OpenAPI / Swagger documentation generation for `/api/v1/*`.

## Phase 6: Advanced Connectivity
- [x] Integrate Company Webhooks allowing programmatic notification when dataset samples are approved.

## Phase 5: Additional Deployment Polish
- [x] Dockerfile explicitly written for the independent BullMQ `worker.ts` node process.
- [x] Replaced generic video placeholders in the Admin QC UI with authorized AWS S3 presigned URLs.
- [x] Refactored background worker logic into testable utilities (`src/lib/video-processor.ts`).
- [x] Expanded Vitest test suite to cover worker pure functions.
- [ ] Stabilize local integration testing pipeline for Next.js and worker using robust Prisma test seeders.
