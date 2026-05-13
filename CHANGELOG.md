# Changelog

## v0.1.9
- Created the `/api/v1/creator/submissions/[id]/video` route to securely issue presigned S3 URLs to creators for their own past uploads.
- Enhanced the `CreatorDashboard` UI with a new "Recent Submissions" section featuring a dynamic `CreatorVideoPlayer`, allowing creators to stream their submitted videos and review payout statuses.
- Polished the Creator dashboard UI with improved responsive layouts and status indicators.

## v0.1.8
- Cleaned up root directory by archiving multi-agent instruction files (`AGENTS.md`, `CLAUDE.md`, etc.) into a dedicated `docs/agents/` folder.
- Refactored core integration utilities (`storage.ts`, `payments.ts`, `queue.ts`) into a new `src/lib/services/` directory to streamline the `lib` folder.
- Updated import paths globally to reflect the structural refactoring.

## v0.1.7
- Refactored `worker.ts` FFprobe extraction logic into a pure, testable utility (`src/lib/video-processor.ts`).
- Expanded the Vitest suite with unit tests verifying FFprobe metadata extraction (resolution, duration, fps).
- Completed the final remaining low-priority task from the MVP roadmap.

## v0.1.6
- Implemented `Dockerfile.worker` to allow the BullMQ video processor to be deployed and scaled independently of the Next.js web application.
- Added `/api/v1/admin/submissions/[id]/video` route to securely issue presigned S3 URLs to administrators for raw submission reviews.
- Enhanced the `AdminDashboard` UI by replacing placeholder blocks with live `<video>` elements that dynamically fetch these secure presigned URLs.

## v0.1.5
- Integrated `swagger-jsdoc` and `swagger-ui-react`.
- Added JSDoc OpenAPI annotations to `/api/v1/missions` and `/api/v1/datasets/[id]/manifest` routes.
- Exposed a dynamic OpenAPI JSON endpoint at `/api/v1/docs`.
- Created an interactive Swagger UI developer portal at `/docs`.

## v0.1.4
- Integrated `fluent-ffmpeg` and `@ffmpeg-installer/ffmpeg` into the BullMQ background worker.
- Replaced hardcoded dummy video metadata with real FFprobe extraction against the uploaded video streams.

## v0.1.3
- Replaced mocked Stripe integrations with the official Stripe Node.js SDK.
- The `src/app/api/v1/creator/onboarding/route.ts` now uses `stripe.accountLinks.create` for real Connect Express onboarding.
- The `processPayouts` utility in `src/lib/payments.ts` now triggers real transfers to connected accounts via `stripe.transfers.create`, handling cents conversion and error states.

## v0.1.2
- Integrated `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.
- Removed mocked local URLs (`mock-storage.com`) from upload and dataset manifest routes.
- The `generateUploadUrl` and `generateDownloadUrl` functions now issue real temporary, signed credentials against standard S3-compatible endpoints.

## v0.1.1
- Restructured global project documentation (VISION, ROADMAP, IDEAS, TODO, MEMORY, DEPLOY).
- Defined Agent instructions across all major LLM profiles.
- Integrated `VERSION` file display into the global layout footer.
- Mapped mocked integrations to prepare for Phase 3 development.

## v0.1.0
- Initial MVP Launch.
- Set up DB, Queues, RBAC, API routes, and rate-limiting.
