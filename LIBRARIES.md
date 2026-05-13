# Project Libraries and Structure

## Core Framework
* **next** (v16.2.6): The React framework utilizing the App Router.
* **react / react-dom** (v19.2.4): Core rendering libraries.

## Database & ORM
* **@prisma/client** & **prisma** (v6.4.1): Type-safe ORM connecting to the PostgreSQL database.

## Authentication & Security
* **next-auth** (v5.0.0-beta.31): Handles sessions, JWTs, and callbacks for UI authentication.
* **bcryptjs**: Used solely for hashing user passwords (NOT API keys).
* **zod**: Schema validation for incoming API payloads.

## Queues & Background Processing
* **bullmq** & **ioredis**: Manages the video processing queue, offloading heavy lifting (FFmpeg, VLM labeling) from the web server.

## UI & Styling
* **tailwindcss** (v4): Utility-first CSS framework.
* **recharts**: Charting library used in the Company dashboard.
* **swagger-ui-react**: Interactive API docs UI mounted at `/docs`.

## Testing
* **vitest**: Blazing fast testing framework replacing Jest.
* **jsdom**: Simulates the browser environment for Vitest.
