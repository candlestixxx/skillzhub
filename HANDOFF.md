# Handoff Documentation

## Completed
* Scaffolded Next.js App Router, Prisma ORM, Neon Postgres, Tailwind CSS.
* Developed role-based UI and protected API routes for Creators, Companies, and Admins.
* Integrated BullMQ for background video processing workflows.
* Implemented fast API Key programmatic authentication (using SHA-256).
* Implemented Redis token-bucket rate limiters.
* Wrote integration tests covering rate limits and core API routes.

## Current Missing / Mocked Pieces
* Storage uploads and downloads use mock S3 logic (`https://mock-storage.com`).
* Payments use mocked Stripe Connect endpoints and IDs.
* Auto-labeling and FFmpeg video manipulation in `worker.ts` is skipped, instead returning hardcoded dummy JSON metadata.

## Instructions for Next Model
1. Review `ROADMAP.md` and `TODO.md` to pick up the next task.
2. Focus on removing the mocks: start by implementing the `aws-sdk-v3` implementation in `src/lib/storage.ts`.
3. Expand testing to cover the worker process logic.
4. Ensure you follow instructions in `AGENTS.md` regarding bumping versions and updating changelogs during your development cycles.
