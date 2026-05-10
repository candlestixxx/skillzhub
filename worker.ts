import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

console.log('Worker started...')

const worker = new Worker('video-processing', async job => {
  const { submissionId, rawStorageKey } = job.data
  console.log(`Processing submission ${submissionId}`)

  try {
    console.log(`Running simulated ffmpeg for ${rawStorageKey}...`)
    await new Promise(r => setTimeout(r, 2000))

    const mockMetadata = {
        duration_seconds: 120,
        resolution_width: 1920,
        resolution_height: 1080,
        fps: 60
    }

    const isQCPass = mockMetadata.resolution_width >= 1920 && mockMetadata.fps >= 30

    const mockLabels = {
        action_summary: "Person walks into garage and picks up power drill",
        objects: ["garage", "drill", "hand"],
        environment: ["indoor", "cluttered"]
    }

    await prisma.submission.update({
        where: { id: submissionId },
        data: {
            ...mockMetadata,
            processing_status: isQCPass ? 'IN_REVIEW' : 'AUTO_QC_FAIL',
            auto_qc_report: { passed: isQCPass, checks: { resolution: true, fps: true } },
            labels_summary: mockLabels,
            normalized_storage_key: `submissions/${submissionId}/normalized.mp4`
        }
    })

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
