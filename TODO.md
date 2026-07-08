# TODO List

### High Priority
- [x] Replace `https://mock-storage.com` mocks in `src/app/api/v1/datasets/[id]/manifest/route.ts` and `init-upload` route with real S3 Signed URL generation.
- [x] Replace Stripe Connect onboarding and transfer mocks in `src/lib/payments.ts` and `src/app/api/v1/creator/onboarding/route.ts`.
- [x] Write a Dockerfile specifically for running `worker.ts` independently of the Next.js web process for cloud deployments.

### Medium Priority
- [x] Implement actual video metadata extraction (resolution, duration, fps) inside the worker job processor.
- [x] Setup OpenAPI (Swagger) spec generation using a library like `swagger-jsdoc` to document the API surface automatically.
- [x] Replace placeholder videos in the Admin review UI with actual presigned URLs pointing to the raw storage bucket.
- [x] Implement Reputation Score updates and Trust Tier auto-upgrades/downgrades on submission accept/reject.

### Low Priority
- [x] Expand Vitest test suite to cover all Prisma schemas and background worker logic.
- [x] Integrate real Google Gemini VLM auto-labeling within worker.ts, deprecating hardcoded mock labels.
- [x] Add visual UI feedback indicating the reputation score progression in the Creator Dashboard.
- [x] Refactor VLM generation to utilize the `GoogleAIFileManager` API instead of direct URL processing.
- [x] Add comprehensive Vitest tests for VLM processor (`tests/vlm.test.ts`) covering fallback paths, Gemini analysis, polling, and error states.
- [x] Fix `e2e_pipeline.ts` Prisma seeding by adding `price_per_minute` (and any other missing schema fields) to `prisma.mission.create`.
- [x] Successfully execute local e2e pipeline test to verify worker queues.
