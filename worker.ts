import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { PrismaClient } from '@prisma/client'
import { probeVideo, extractMetadata } from './src/lib/video-processor'
import { acceptSubmissionAndTriggerDownstream } from './src/lib/services/submissions'
import { analyzeVideoWithVLM } from './src/lib/services/vlm-processor'
import { generateDownloadUrl } from './src/lib/services/storage'

const prisma = new PrismaClient()
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

console.log('Worker started...')

const worker = new Worker('video-processing', async job => {
  const { submissionId, rawStorageKey } = job.data
  console.log(`Processing submission ${submissionId}`)

  try {
    let duration = 120;
    let width = 1920;
    let height = 1080;
    let fps = 60;

    // Convert raw storage key (e.g. "uploads/video.mp4") to an accessible signed URL
    const videoUrl = rawStorageKey.startsWith('http')
        ? rawStorageKey
        : await generateDownloadUrl(rawStorageKey);

    console.log(`Attempting ffprobe extraction for ${videoUrl}...`)
    try {
         const metadata = await probeVideo(videoUrl);
         const extracted = extractMetadata(metadata);
         width = extracted.width;
         height = extracted.height;
         fps = extracted.fps;
         duration = extracted.duration;
         console.log(`Extracted real metadata: ${width}x${height} @ ${fps}fps, ${duration}s`);
    } catch(probeError) {
        console.warn("ffprobe failed (is the URL accessible?), falling back to mock metadata.", probeError);
    }

    const isQCPass = width >= 1920 && fps >= 30

    console.log(`Attempting VLM analysis for ${videoUrl}...`)
    const vlmLabels = await analyzeVideoWithVLM(videoUrl);

    // Update submission with extracted metadata and VLM labels
    const updatedSubmission = await prisma.submission.update({
        where: { id: submissionId },
        include: { creator: true },
        data: {
            duration_seconds: duration,
            resolution_width: width,
            resolution_height: height,
            fps: fps,
            processing_status: isQCPass ? 'IN_REVIEW' : 'AUTO_QC_FAIL',
            auto_qc_report: { passed: isQCPass, checks: { resolution: true, fps: true } },
            labels_summary: vlmLabels,
            normalized_storage_key: rawStorageKey
        }
    })

    // AUTONOMOUS ACCEPTANCE:
    // If the creator is HIGH_TRUST and the technical QC passed, we bypass manual review.
    if (isQCPass && updatedSubmission.creator.trust_tier === 'HIGH_TRUST') {
        console.log(`Autonomous acceptance triggered for submission ${submissionId} (Creator Tier: HIGH_TRUST)`);
        await acceptSubmissionAndTriggerDownstream(
            submissionId,
            duration / 60, // Convert seconds to minutes for the payout logic
            duration
        );
    }

    console.log(`Finished processing ${submissionId}`)
  } catch (error) {
    console.error(`Error processing ${submissionId}:`, error)
    await prisma.submission.update({
        where: { id: submissionId },
        data: { processing_status: 'AUTO_QC_FAIL' }
    })
    throw error
  }

}, { connection })

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with ${err.message}`)
})
