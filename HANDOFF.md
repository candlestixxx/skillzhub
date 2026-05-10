# Handoff Document

## Current State
The project MVP is fully implemented and structurally complete. All core API endpoints and UI dashboards (Creator, Company, Admin) defined in the brief have been built and integrated. The application builds without errors.

## What's Completed
- **Database Schema**: Fully defined and migrated via Prisma using Neon Postgres (User, Mission, Submission, Dataset, License, API Keys, PaymentLedger).
- **Authentication**: Email/password authentication using NextAuth with integrated bcryptjs.
- **RBAC**: Strict role-based access control via `middleware.ts` protecting `/creator`, `/company`, and `/admin` routes.
- **API**: Full CRUD endpoints for Missions, Submissions, Datasets, and API keys.
- **Frontend UI**: Built out the `CreatorDashboard`, `CompanyDashboard`, and `AdminDashboard` using interactive React client components matching the specified workflow.
- **Video Pipeline**: A BullMQ-powered background worker (`worker.ts`) backed by a local Redis instance handles simulated video processing, QC, and auto-labeling.
- **Payments & Datasets**: Automated dataset generation and mock Stripe payout calculations are triggered upon admin acceptance of a submission.

## What's Missing / Next
- The `worker.ts` script uses mock timing and hardcoded logic for ffmpeg processing and VLM auto-labeling. It needs to be hooked up to real containerized workflows.
- Real S3 signed URLs logic needs to replace the current mock presigned URL strings.
- Real Stripe Connect integration must replace the currently mocked ledger entries.

## Architecture & Stack
- **Framework:** Next.js (App Router, TypeScript)
- **DB:** Neon Postgres, Prisma ORM
- **Queue:** BullMQ + Redis
- **Auth:** NextAuth + bcryptjs
