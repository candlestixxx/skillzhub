# Agent Instructions

## Codebase Conventions
- Use `Next.js App Router` conventions.
- All database interactions must use `Prisma`. Do not write raw SQL unless absolutely necessary.
- API endpoints belong in `src/app/api/v1/`.
- Frontend views belong in `src/app/`.
- Protect routes using the `src/middleware.ts` logic or explicitly check session roles in route handlers.

## Running the app
- Run `npm run dev` to start the Next.js server.
- Run `npx tsx worker.ts` in a separate terminal to start the background queue processing.
- The database is hosted on Neon (see `.env`).
- Redis is required locally for the BullMQ worker (`redis://localhost:6379`).
