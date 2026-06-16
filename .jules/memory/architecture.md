# SkillzHub Architecture

## Overview
SkillzHub is a marketplace platform connecting bounty hunters (creators) with clients who need tasks completed. Built with Next.js 15, Prisma, and various AI integrations.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), React, TypeScript, TailwindCSS
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL (via Prisma)
- **AI/VLM**: Google Gemini API integration for auto-labeling and content review
- **Deployment**: Docker containers, Vercel-compatible

## Key Features
1. **Mission System**: Bounties/tasks with boostable payments
2. **Creator Trust Tiers**: Automated acceptance based on reputation
3. **Edge Validation**: Middleware and error boundaries
4. **VLM Auto-Labeling**: Google Gemini API integration for automated content moderation

## Database Schema (prisma/schema.prisma)
- User, Creator, Client models
- Mission, Submission models
- Trust tier tracking
- Boost mechanism for payment multipliers

## API Routes
- `/api/v1/auth/*` - Authentication
- `/api/v1/missions/*` - Mission CRUD and boosts
- `/api/v1/admin/submissions/*` - Review workflow
- `/api/v1/bounties/*` - Bounty management

## Services
- `submissions.ts` - Submission processing
- `vlm-processor.ts` - VLM/Gemini integration
