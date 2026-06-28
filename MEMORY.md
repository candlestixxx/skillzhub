# SkillzHub Memory

## Architectural Observations
- **Service Layer Pattern**: Business logic is encapsulated within `src/lib/services/` (e.g., `submissions.ts`, `payments.ts`, `webhooks.ts`). This keeps API routes thin and ensures logic can be reused by both the web server and the background worker.
- **Background Jobs**: Heavy lifting like video metadata extraction and VLM labeling is offloaded to BullMQ. The worker is designed to be independently scalable.
- **Shared Schemas**: Validation logic is centralized in `src/lib/schemas/` to ensure consistency between the frontend and backend.

## Design Preferences
- **Minimalist UI**: Use Tailwind CSS for a clean, professional aesthetic.
- **Progressive Disclosure**: Only show complex options (like webhook configuration or manual QC overrides) when necessary.
- **Creator First**: Prioritize features that reduce friction for creators, such as the "Trust Tier" system to automate acceptance for high-reputation users.

## Technical Debt / Known Constraints
- **VLM Integration**: The VLM processor has been successfully migrated to a real Gemini 2.0 Flash integration using the Google Generative AI SDK.
- **Local Development**: Redis is a hard requirement for the application to function, even in development, due to its role in the job queue and rate limiting.
