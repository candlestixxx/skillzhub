import { PrismaClient } from '@prisma/client'
import { Queue } from 'bullmq'
import Redis from 'ioredis'

const prisma = new PrismaClient()
const connection = new Redis('redis://localhost:6379')
const queue = new Queue('video-processing', { connection })

async function run() {
    // 1. Create a dummy user
    const user = await prisma.user.create({
        data: {
            email: 'test_worker@example.com',
            name: 'Test Worker',
            role: 'CREATOR'
        }
    })

    // 2. Create a dummy mission
    const mission = await prisma.mission.create({
        data: {
            company_id: user.id,
            title: 'Worker Test Mission',
            description: 'Testing worker',
            task_type: 'FPV',
            environment_type: 'URBAN',
            price_per_minute: 10.0,
            license_type: 'EXCLUSIVE',
            status: 'OPEN'
        }
    })

    // 3. Create a dummy submission
    const submission = await prisma.submission.create({
        data: {
            mission_id: mission.id,
            creator_id: user.id,
            // Use a reliable public test video URL for ffprobe to test against
            raw_storage_key: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            processing_status: 'UPLOADED'
        }
    })

    console.log(`Created submission: ${submission.id}. Adding to queue...`);

    // 4. Add to queue
    await queue.add('process-video', {
        submissionId: submission.id,
        rawStorageKey: submission.raw_storage_key
    })

    console.log("Job added to queue. Waiting 15 seconds for worker to process...");

    // 5. Wait for worker
    await new Promise(resolve => setTimeout(resolve, 15000));

    // 6. Check the result
    const updated = await prisma.submission.findUnique({
        where: { id: submission.id }
    })

    console.log("\n--- WORKER RESULT ---")
    console.log(`Status: ${updated?.processing_status}`);
    console.log(`Duration: ${updated?.duration_seconds}`);
    console.log(`Resolution: ${updated?.resolution_width}x${updated?.resolution_height}`);
    console.log(`FPS: ${updated?.fps}`);
    console.log(`VLM Failed Flag: ${updated?.auto_qc_report ? (updated.auto_qc_report as any).vlm_failed : 'unknown'}`);

    // Clean up
    await prisma.submission.delete({ where: { id: submission.id }});
    await prisma.mission.delete({ where: { id: mission.id }});
    await prisma.user.delete({ where: { id: user.id }});
    await connection.quit();
    await prisma.$disconnect();
}

run().catch(console.error);
