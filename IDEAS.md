# SkillzHub - Ideas & Improvements

## Technical Enhancements
- **Multi-region Storage:** Route uploads to the nearest S3 bucket to lower latency for international creators.
- **Webhooks:** Allow companies to register a webhook URL to receive notifications when a new dataset sample is approved for their mission.
- **Edge Functions:** Move API key validation and rate-limiting to edge networks (e.g., Vercel Edge Middleware or Cloudflare Workers) to drastically reduce latency and DB load.

## Product Features
- **Creator Tiers:** Gamify the creator side with "Trust Tiers." High-trust creators bypass manual admin QC and go straight to dataset generation.
- **Bounty Boosts:** Allow companies to surge pricing dynamically for specific environments if they aren't getting enough submissions.
- **Synthetic Data Upsell:** Offer companies a one-click button in the UI to generate depth maps or segmentation masks for purchased datasets for an extra fee.
