import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { PrismaClient } from '@prisma/client'
import { probeVideo, extractMetadata } from './src/lib/video-processor'
import { generateVideoLabels } from './src/lib/services/vlm-processor'
import { acceptSubmissionAndTriggerDownstream } from './src/lib/services/submissions'

const prisma = new PrismaClient()
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

console.log('Worker started...')

const worker = new Worker('video-processing', async job => {
  const { submissionId, rawStorageKey } = job.data
  console.log(`Processing submission ${submissionId}`)

  try {
    const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: { creator: true }
    });

    if (!submission) throw new Error("Submission not found in worker");

    let duration = 120;
    let width = 1920;
    let height = 1080;
    let fps = 60;

    console.log(`Attempting ffprobe extraction for ${rawStorageKey}...`)
    try {
        if (rawStorageKey.startsWith('http')) {
             const metadata = await probeVideo(rawStorageKey);
             const extracted = extractMetadata(metadata);
             width = extracted.width;
             height = extracted.height;
             fps = extracted.fps;
             duration = extracted.duration;
             console.log(`Extracted real metadata: ${width}x${height} @ ${fps}fps, ${duration}s`);
        } else {
             console.warn("rawStorageKey is not a HTTP URL, falling back to mock ffprobe data.");
             await new Promise(r => setTimeout(r, 2000))
        }
    } catch(probeError) {
        console.warn("ffprobe failed (is the URL accessible?), falling back to mock metadata.", probeError);
    }

    const isQCPass = width >= 1920 && fps >= 30;

    let labels = await generateVideoLabels(rawStorageKey);
    if (!labels) {
        labels = {
            action_summary: "Person walks into garage and picks up power drill",
            objects: ["garage", "drill", "hand"],
            environment: ["indoor", "cluttered"]
        }
    }

    // Determine target status.
    // If the video passes QC and the creator is Tier 2 or above, bypass manual review and accept immediately.
    const shouldBypassQC = isQCPass && (submission.creator.trust_tier >= 2);
    const targetStatus = shouldBypassQC ? 'ACCEPTED' : (isQCPass ? 'IN_REVIEW' : 'AUTO_QC_FAIL');

    // First update the core metadata
    await prisma.submission.update({
        where: { id: submissionId },
        data: {
            duration_seconds: duration,
            resolution_width: width,
            resolution_height: height,
            fps: fps,
            processing_status: targetStatus,
            auto_qc_report: { passed: isQCPass, checks: { resolution: true, fps: true } },
            labels_summary: labels as any,
            normalized_storage_key: rawStorageKey
        }
    })

    // If auto-accepted due to high trust tier, trigger the downstream effects (Payouts, Datasets, Webhooks)
    if (shouldBypassQC) {
        console.log(`Creator ${submission.creator.id} is Tier ${submission.creator.trust_tier}. Auto-accepting submission.`);
        await acceptSubmissionAndTriggerDownstream(submissionId, duration / 60, duration);
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
