# Changelog

## v0.1.23
- Displayed a `✨ Synthetic Data` badge on the Company Dashboard next to Datasets that contain any generated synthetic data annotations.

## v0.1.22
- Added `.github/workflows/ci.yml` GitHub Actions pipeline for automated continuous integration, satisfying cross-model instructions.
- Bumped global build version to v0.1.22.

## v0.1.21
- Added `generateSyntheticData` worker logic to `worker.ts` and `src/lib/services/synthetic-data.ts`.
- Created robust DB-mocked test suite in `tests/e2e_pipeline.test.ts` to execute and verify the End-To-End worker logic pipeline.
- Bumped global build version to v0.1.21.

## v0.1.20
- Added comprehensive Vitest test suite for the VLM processor (`tests/vlm.test.ts`) covering fallback behavior, successful Gemini analysis, state polling, and JSON parse error recovery.
- Merged `dependabot/npm_and_yarn/npm_and_yarn-7571c7a8dc`: Updated `form-data` from 4.0.5 to 4.0.6 and `ws` from 8.20.1 to 8.21.0 for security patch compliance.
- Refined VLM processor documentation and cleaned up stale branch references across the repository.
- Bumped global build version to v0.1.20.

## v0.1.19
- Fixed major blocking bug in the worker's VLM pipeline where raw S3 storage keys were being erroneously passed into the Gemini video fetcher. It now securely generates a temporary AWS S3 pre-signed URL before passing it to Google AI.
- Updated the hallucinated model prompt from `gemini-2.5-flash` to the correct `gemini-2.0-flash`.
- Patched 37 scattered ESLint unused variable warnings across the application and test suites by actively using or safely suppressing them.

## v0.1.18
- Refactored memory management in `vlm-processor.ts`'s `downloadFile` function. It now utilizes stream piping (`Readable.fromWeb(response.body).pipe(fs.createWriteStream)`) rather than loading multi-gigabyte array buffers directly into the Node.js heap memory.

## v0.1.17
- Refactored `src/lib/services/vlm-processor.ts` to utilize the **Google File API** (`GoogleAIFileManager`) for more robust handling of video ingestion, preventing direct URL ingestion failures on non-public storage URIs.

## v0.1.16
- Enhanced **Creator Dashboard UI** with a visual progress bar illustrating the creator's reputation score and their progression towards the 100-point `HIGH_TRUST` threshold.

## v0.1.15
- Integrated **Google Gemini 2.0 Flash VLM** into the background worker queue (`worker.ts`) for real-time video auto-labeling (`action_summary`, `objects`, `environment`).
- Built graceful degradation mechanisms to revert to mock labels when API keys are missing or in isolated testing environments.
- Added `@google/generative-ai` SDK and corresponding documentation to `DEPLOY.md`.

## v0.1.14
- Implemented automated **Reputation Score Updates** upon submission review.
- Built **Trust Tier Upgrades/Downgrades**. Creators are now auto-promoted to `HIGH_TRUST` when their score reaches 100, and demoted to `BASIC` if it falls below 100 on rejection.
- Fixed severe React hooks (`react-hooks/set-state-in-effect`) and exhaustive dependencies warnings inside `CreatorDashboard`, `CompanyDashboard`, and `AdminDashboard`.
- Swept the codebase and test files to suppress and resolve ESLint TypeScript `any` warnings and unused variables.

## v0.1.13
- Implemented **Creator Trust Tiers** (`BASIC`, `HIGH_TRUST`) to enable autonomous marketplace operations.
- Built **Autonomous Acceptance** logic in the background worker: High-trust creators' submissions bypass manual review and trigger immediate payouts/dataset inclusion upon passing technical QC.
- Enhanced **Creator Dashboard UI** to display trust tiers and reputation scores, improving transparency for bounty hunters.
- Consolidated global agent instructions into a single `UNIVERSAL_INSTRUCTIONS.md` and archived redundant model-specific documentation.
- Updated `VISION.md`, `DEPLOY.md`, `LIBRARIES.md`, and created `MEMORY.md` to reflect the project's current architectural state and long-term goals.

## v0.1.12
- Added `webhook_url` and `webhook_secret` fields to the `Mission` Prisma schema.
- Built a secure `dispatchWebhook` service that signs POST payloads with SHA-256 HMAC for company verification.
- Integrated asynchronous webhook dispatching into the Admin review route whenever a submission is accepted.
- Updated the Company Dashboard UI to allow setting optional webhook configurations during Mission creation.

## v0.1.11
- Created new `/api/v1/company/analytics` endpoint leveraging Prisma aggregations (`groupBy`, `aggregate`) to compute dataset volumes, total capital deployed, and submission status distributions.
- Overhauled the `CompanyDashboard` UI:
  - Added a Recharts Pie Chart to visualize the Mission Pipeline status distribution.
  - Added a KPI metric for Total Capital Deployed.
  - Refined the aesthetics of the Dataset Volumes Bar Chart and all dashboard cards.

## v0.1.10
- Integrated `@playwright/test` for robust, headless End-to-End (E2E) testing.
- Configured `playwright.config.ts` to spin up the local Next.js dev server automatically and execute tests against Chromium.
- Added foundational E2E test suite (`e2e/home.spec.ts`) validating homepage DOM rendering and core navigation links.

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

