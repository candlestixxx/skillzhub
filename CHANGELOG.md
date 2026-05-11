# Changelog

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
