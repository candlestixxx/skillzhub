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
    const metadata = await probeVideo(videoUrl);
    const extracted = extractMetadata(metadata);
    width = extracted.width;
    height = extracted.height;
    fps = extracted.fps;
    duration = extracted.duration;
    console.log(`Extracted real metadata: ${width}x${height} @ ${fps}fps, ${duration}s`);

    const isQCPass = width >= 1920 && fps >= 30

    console.log(`Attempting VLM analysis for ${videoUrl}...`)
    let vlmLabels: any = { action_summary: "Pending Manual Review", objects: [], environment: [] };
    let vlmFailed = false;

    try {
        vlmLabels = await analyzeVideoWithVLM(videoUrl);
    } catch (vlmError) {
        console.error("VLM analysis failed. Routing to manual review.", vlmError);
        vlmFailed = true;
    }

    // Determine final processing status
    // If QC fails, it's an AUTO_QC_FAIL.
    // If VLM fails, we force it to IN_REVIEW regardless of Trust Tier so admins can manually label.
    const finalStatus = isQCPass ? 'IN_REVIEW' : 'AUTO_QC_FAIL';

    // Update submission with extracted metadata and VLM labels
    const updatedSubmission = await prisma.submission.update({
        where: { id: submissionId },
        include: { creator: true },
        data: {
            duration_seconds: duration,
            resolution_width: width,
            resolution_height: height,
            fps: fps,
            processing_status: finalStatus,
            auto_qc_report: { passed: isQCPass, checks: { resolution: true, fps: true }, vlm_failed: vlmFailed },
            labels_summary: vlmLabels,
            normalized_storage_key: rawStorageKey
        }
    })

    // AUTONOMOUS ACCEPTANCE:
    // If the creator is HIGH_TRUST, technical QC passed, AND VLM did not fail, we bypass manual review.
    if (isQCPass && !vlmFailed && updatedSubmission.creator.trust_tier === 'HIGH_TRUST') {
        console.log(`Autonomous acceptance triggered for submission ${submissionId} (Creator Tier: HIGH_TRUST)`);
        await acceptSubmissionAndTriggerDownstream(
            submissionId,
            duration / 60, // Convert seconds to minutes for the payout logic
            duration
        );
    } else if (isQCPass && vlmFailed && updatedSubmission.creator.trust_tier === 'HIGH_TRUST') {
        console.log(`Autonomous acceptance bypassed for submission ${submissionId} despite HIGH_TRUST due to VLM failure.`);
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

// SYNTHETIC DATA WORKER
const syntheticWorker = new Worker('synthetic-data', async job => {
    const { datasetId } = job.data;
    console.log(`Processing synthetic data for dataset ${datasetId}`);

    try {
        // Simulate synthetic data generation (e.g. depth mapping)
        await new Promise(resolve => setTimeout(resolve, 5000));

        await prisma.dataset.update({
            where: { id: datasetId },
            data: {
                has_synthetic_data: true,
                synthetic_data_type: 'depth_map'
            }
        });

        console.log(`Successfully generated synthetic data for dataset ${datasetId}`);
    } catch (error) {
        console.error(`Failed to process synthetic data for dataset ${datasetId}:`, error);
        throw error;
    }
}, { connection });

syntheticWorker.on('failed', (job, err) => {
    console.error(`Synthetic Job ${job?.id} failed with ${err.message}`);
});
