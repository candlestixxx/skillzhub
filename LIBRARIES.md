# Project Libraries and Structure

## Core Framework
* **next** (v15.0.0-rc.0): The React framework utilizing the App Router.
* **react / react-dom** (v19.0.0-rc-f994737d14-20240522): Core rendering libraries.

## Database & ORM
* **@prisma/client** & **prisma** (v5.14.0): Type-safe ORM connecting to the PostgreSQL database.

## Authentication & Security
* **next-auth** (v5.0.0-beta.18): Handles sessions, JWTs, and callbacks for UI authentication.
* **bcryptjs**: Used solely for hashing user passwords (NOT API keys).
* **zod**: Schema validation for incoming API payloads.

## Queues & Background Processing
* **bullmq** & **ioredis**: Manages the video processing queue, offloading heavy lifting (FFmpeg, VLM labeling) from the web server.

## UI & Styling
* **tailwindcss** (v4.0.0-alpha.15): Utility-first CSS framework.
* **lucide-react**: Icon library.
* **recharts**: Charting library used in the Company dashboard.

## Testing
* **vitest** & **@vitejs/plugin-react**: Blazing fast testing framework replacing Jest.
* **jsdom**: Simulates the browser environment for Vitest.
