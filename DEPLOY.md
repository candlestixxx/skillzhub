# Deployment Guide

## Infrastructure Requirements
- **PostgreSQL**: Primary database.
- **Redis**: Required for BullMQ job queues and rate limiting.
- **S3-Compatible Storage**: For hosting raw and normalized video files.
- **Stripe Account**: For processing creator payouts via Stripe Connect.

## Environment Variables
Ensure the following variables are set in your production environment:
- `DATABASE_URL`: PostgreSQL connection string.
- `REDIS_URL`: Redis connection string.
- `NEXTAUTH_SECRET`: Secret for session encryption.
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`: Storage credentials.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`: Payment credentials.
- `GEMINI_API_KEY`: For VLM auto-labeling.

## Deployment Steps

### 1. Database Migrations
Run the following to ensure the schema is up to date:
```bash
npx prisma migrate deploy
```

### 2. Web Application
Build and start the Next.js application:
```bash
npm run build
npm start
```

### 3. Background Worker
The worker processes video files and handles auto-labeling. It should be run as a separate process or container:
```bash
# Using tsx for development/direct execution
npx tsx worker.ts

# Or using the Dockerfile
docker build -t skillzhub-worker -f Dockerfile.worker .
docker run skillzhub-worker
```

## Monitoring
- Monitor the Redis queue depth to ensure the worker is keeping up with submissions.
- Check the `ProcessingStatus` of submissions in the database for any `AUTO_QC_FAIL` trends.
