# SkillzHub - Ideas & Improvements

## Technical Enhancements
- **Multi-region Storage:** Route uploads to the nearest S3 bucket to lower latency for international creators.

- **[IMPLEMENTED] Edge Functions:** Moved API key hashing to Next.js middleware and migrated auth routes to the Edge runtime to drastically reduce latency and DB load.

## Product Features
- **Creator Tiers:** Gamify the creator side with "Trust Tiers." High-trust creators bypass manual admin QC and go straight to dataset generation.
- **Bounty Boosts:** Allow companies to surge pricing dynamically for specific environments if they aren't getting enough submissions.
- **Synthetic Data Upsell:** Offer companies a one-click button in the UI to generate depth maps or segmentation masks for purchased datasets for an extra fee.

## Aggressive Ideas & Pivots
- **Multi-Modal Native Mobile App:** Migrate the creator upload pipeline from a responsive web app into a React Native app. This allows direct hardware access to iOS/Android gyroscope and accelerometer streams, feeding them directly into the background worker metadata for richer robotics training datasets.
- **Real-time Live Bounties:** Shift the C2B model from asynchronous uploads to synchronous streaming. AI companies define a mission, and a fleet of connected creators stream their feed via WebRTC directly into a central evaluation engine in real time to resolve data collection instantly.
- **Micro-Dataset Decentralization (Web3):** Tokenize accepted Dataset Samples. Allow secondary machine learning firms to purchase highly targeted subsets of datasets on-chain, automatically dripping royalties down to the original creator without Stripe overhead or ledger processing delays.
- **Language Porting:** Strip the monolithic Next.js backend logic and port the NextAuth/Prisma core into a high-performance Go or Rust microservice cluster to dramatically increase concurrent video processing throughput while letting Next.js focus solely on Edge SSR delivery.
