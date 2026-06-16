# Project Libraries and Structure

## Core Framework
* **next** (v16.2.6): The React framework utilizing the App Router.
* **react / react-dom** (v19.2.4): Core rendering libraries.

## Database & ORM
* **@prisma/client** & **prisma** (v6.4.1): Type-safe ORM connecting to the PostgreSQL database.

## Authentication & Security
* **next-auth** (v5.0.0-beta.31): Handles sessions, JWTs, and callbacks for UI authentication.
* **bcryptjs** (v3.0.3): Used for hashing user passwords.
* **zod** (v4.4.3): Schema validation for incoming API payloads.

## Queues & Background Processing
* **bullmq** (v5.76.6) & **ioredis** (v5.10.1): Manages the video processing queue, offloading heavy lifting (FFmpeg, VLM labeling) from the web server.

## UI & Styling
* **tailwindcss** (v4): Utility-first CSS framework.
* **lucide-react**: Icon library.
* **recharts** (v3.8.1): Charting library used in the dashboards.

## Video Processing
* **fluent-ffmpeg** (v2.1.3): Command-line wrapper for FFmpeg.
* **@ffmpeg-installer/ffmpeg** (v1.1.0): Static FFmpeg binaries.

## Payments & Storage
* **stripe** (v22.1.1): Official Node.js library for Stripe payments.
* **@aws-sdk/client-s3** (v3.1045.0): AWS SDK for S3 storage interactions.

## Testing
* **vitest** (v4.1.5): Unit and integration testing framework.
* **@playwright/test** (v1.60.0): End-to-end testing framework.
