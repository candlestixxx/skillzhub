[PROJECT_MEMORY]

# SkillzHub - Comprehensive Project Memory & Architecture

## 1. Project Overview & Vision
SkillzHub is a C2B (Creator-to-Business) marketplace specifically designed for sourcing skilled GoPro and FPV drone footage. This footage is primarily targeted at businesses training AI models and robots. The core loop involves Companies creating "Missions" with specific requirements, and Creators uploading raw video submissions to fulfill them. Accepted submissions are aggregated into downloadable Datasets.

## 2. Technology Stack & Core Integrations
*   **Frontend Framework:** Next.js 16 (App Router) with React, built and served using Turbopack.
*   **Styling:** Tailwind CSS for utility-first styling.
*   **Database & ORM:** PostgreSQL (hosted via Neon DB) managed by Prisma ORM.
*   **Authentication:** NextAuth.js handling RBAC (Role-Based Access Control) across three primary roles: `CREATOR`, `COMPANY`, and `ADMIN`.
*   **Queueing & Background Processing:** BullMQ backed by Redis handles heavy, asynchronous lifting (specifically video processing and VLM evaluation).
*   **Video Processing:** `fluent-ffmpeg` paired with `@ffmpeg-installer/ffmpeg` handles metadata extraction locally within the worker.
*   **AI / Vision-Language Model (VLM):** Google Gemini 2.0 Flash (via `@google/genai` SDK and `GoogleAIFileManager`) is integrated into the worker to auto-label video footage (extracting `action_summary`, `objects`, and `environment`).
*   **Payments:** Stripe Node.js SDK handles real payouts (transfers) to connected creator accounts via Stripe Connect.
*   **Storage:** AWS S3 (or S3-compatible storage like Cloudflare R2). The platform uses the AWS SDK to aggressively issue temporary **presigned URLs** for uploads, downloads, and playback, ensuring large media streams bypass the Next.js server entirely.
*   **API Documentation:** Swagger UI is implemented using `swagger-jsdoc` and `swagger-ui-react`, exposed dynamically at `/docs`.
*   **Testing:**
    *   Integration/Unit Testing: Vitest (with global polyfills mocking Next.js internals).
    *   E2E Testing: Playwright (`chromium-headless-shell`).

## 3. Core Architectural Patterns & Design Decisions

### 3.1. Infrastructure & Scaling
*   **Worker Isolation:** The BullMQ worker (`worker.ts`) is designed to run completely independent of the Next.js web tier. It has its own dedicated Dockerfile (`Dockerfile.worker`) to allow independent scaling based on queue depth.
*   **Avoid Local Docker:** Due to known 'overlayfs' permission issues in the deployment environment, the project prefers native package installations or cloud database services (Neon) over running heavy Docker containers locally.
*   **Fail-Open / Defensive Design:**
    *   The Redis-backed rate limiter (using atomic INCR/EXPIRE operations) intentionally fails open if Redis goes down, prioritizing API availability over strict limiting.
    *   API Key authentication leverages fast O(1) lookups using SHA-256 hashing rather than slow bcrypt iterations to prevent DoS vulnerabilities. Malformed API keys are rejected early in the Edge Middleware (`src/middleware.ts`) before they reach the Node.js event loop.
    *   Global React Error boundaries (`error.tsx`, `global-error.tsx`) catch runtime crashes.
*   **Build Optimization:** External service clients (Stripe, Redis) utilize lazy instantiation so the Next.js static generation process doesn't crash during build time if environment variables are temporarily missing. `next.config.ts` is configured to ignore ESLint/TypeScript errors to ensure MVP builds do not fail unnecessarily.

### 3.2. Data Aggregation & Logic
*   **Analytics:** Complex analytics (e.g., Company Dashboard KPI metrics) are calculated using Prisma's native aggregation functions (`groupBy`, `aggregate`) directly on the database, avoiding in-memory array manipulation, and rendered via Recharts.
*   **Idempotency:** The background worker's dataset generation logic utilizes Prisma `upsert` queries. This guarantees idempotency, preventing duplicate datasets from being generated if multiple submissions are accepted simultaneously or if a job retries.
*   **Worker Testability:** Logic inside the background worker (such as FFprobe extraction) is deliberately extracted into pure, isolated utility functions (`src/lib/video-processor.ts`). This allows them to be unit-tested in Vitest without requiring a live Redis connection or BullMQ context.

### 3.3. Core Domain Logic
*   **Trust Tiers:** The marketplace gamifies quality. Creators have a Reputation Score and a `trust_tier`. Submissions from high-tier creators (`HIGH_TRUST`, tier 2+) bypass the manual Admin QC queue and are automatically accepted by the background worker, triggering immediate payouts and dataset inclusion.
*   **Bounty Boosts:** Companies can dynamically surge pricing on open missions by +20% (via the `/api/v1/missions/[id]/boost` endpoint) to incentivize creators if a mission is underperforming.
*   **Webhooks:** The platform dispatches asynchronous webhooks to company-provided URLs when datasets are updated. To ensure security, payloads are signed with a SHA-256 HMAC signature using the company's configured webhook secret.

## 4. Repository Governance & Continuous Execution

*   **Autonomy Protocol:** The agent is instructed to operate on "autopilot", executing recommendations sequentially and pushing major steps without pausing for confirmation.
*   **Documentation Standards:** Comprehensive global documentation is strictly maintained. The repository root contains: `VISION.md`, `MEMORY.md`, `DEPLOY.md`, `CHANGELOG.md`, `ROADMAP.md`, `TODO.md`, `HANDOFF.md`, and `IDEAS.md`.
*   **Versioning:** Every successful build/feature increment requires updating the global `VERSION` file, maintaining `CHANGELOG.md`, and committing with the version explicitly referenced.
*   **Cleanliness:** Code is deeply commented explaining the *why* behind implementation choices. Outdated files and redundant agent instruction files are aggressively archived into `docs/archive/`.
*   **Git Automation:** The standard operating procedure requires frequent commits, pushing feature branches to `main`, and recursively updating git submodules to ensure state is synchronized.
