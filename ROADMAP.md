# Roadmap

## Phase 1 (MVP - Completed)
- Next.js scaffolding and database setup (Postgres + Prisma).
- Core auth and RBAC (Creator, Company, Admin).
- Mission and Submission CRUD APIs.

## Phase 2 (Core UI - Completed)
- Basic role-based dashboards mapped to route handlers.

## Phase 3 (Pipeline - Completed)
- BullMQ worker for async background tasks.
- Simulated ffmpeg normalization and VLM auto-labeling.

## Phase 4 (Datasets & Access - Completed)
- API key generation.
- Manifest generation for downloaded datasets.

## Phase 5 (Payments & Docs - Completed)
- Mock payment ledger implementation.
- Documentation mapping.

## Next Steps / Future Roadmap
- Implement real Stripe Connect for creator payouts.
- Hook up actual FFmpeg and object detection/VLM models (e.g., GroundingDINO, Gemini 2.0 Flash) in the worker.
- Replace mock S3 signed URLs with AWS/Wasabi/Backblaze SDKs.
- Expand the frontend UI to include actual video players, charts, and form validations.
- Develop the "synthetic augmentation" upsell feature (depth maps, segmentation).
