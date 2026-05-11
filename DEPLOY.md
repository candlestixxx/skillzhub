# Deployment Instructions

## Database (Neon / Postgres)
1. Ensure the `DATABASE_URL` is set in the environment.
2. Run migrations: `npx prisma migrate deploy`.

## Redis
1. Provision a Redis instance (e.g., Upstash).
2. Set `REDIS_URL`.

## Web Server (Vercel, Render, or Docker)
1. Set all environment variables (NextAuth, AWS, Stripe).
2. Build the application: `npm run build`.
3. Start the application: `npm run start`.

## Background Worker
1. The web server handles API requests. You must run the worker process alongside it to process videos.
2. In a separate process or container, execute: `npx tsx worker.ts`.
