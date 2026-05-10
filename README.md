# SkillzHub MVP

SkillzHub is a C2B marketplace for skilled GoPro and FPV footage used to train AI models and robots.

## Prerequisites
- Node.js >= 18
- Redis server running locally

## Quick Start
1. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Ensure Redis is running:
   ```bash
   sudo service redis-server start
   # or natively depending on your OS
   redis-server &
   ```
3. Install dependencies and run migrations:
   ```bash
   npm install
   npx prisma migrate dev --name init
   npx tsx prisma/seed.ts
   ```
4. Start the development server and worker:
   ```bash
   # Terminal 1
   npm run build && npm start &

   # Terminal 2
   npx tsx worker.ts &
   ```

## Demo Walkthrough
1. **Login:** Access `/api/auth/signin`. Use `admin@skillzhub.com` / `admin123`, `tesla@company.com` / `company123`, or `creator@example.com` / `creator123`.
2. **Company Flow:** Login as company, visit `/company` to create missions and view datasets.
3. **Creator Flow:** Login as creator, visit `/creator` to view open missions and submit footage.
4. **Admin Flow:** Login as admin, visit `/admin` to review submissions in the QC queue.
