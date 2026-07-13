import { describe, it, expect, vi, beforeEach } from 'vitest'

// To safely test worker processing without requiring a live Postgres instance and fully isolated
// mock dependencies before anything gets imported.
vi.mock('ioredis', () => {
    return {
        default: class MockRedis {
            get = vi.fn();
            eval = vi.fn();
        }
    };
});

vi.mock('bullmq', () => {
    return {
        Worker: class MockWorker {
            on = vi.fn();
        }
    };
});

vi.mock('../src/lib/video-processor', () => ({
    probeVideo: vi.fn().mockResolvedValue({
        streams: [
            { width: 1920, height: 1080, r_frame_rate: '60/1', duration: '120.0' }
        ]
    }),
    extractMetadata: vi.fn().mockReturnValue({
        width: 1920,
        height: 1080,
        fps: 60,
        duration: 120
    })
}))

vi.mock('../src/lib/services/vlm', () => ({
    analyzeVideoWithVLM: vi.fn().mockResolvedValue({
        action_summary: "Simulated task completion",
        objects: ["robot", "table"],
        environment: ["laboratory"]
    })
}))

vi.mock('../src/lib/services/synthetic-data', () => ({
    generateSyntheticData: vi.fn().mockResolvedValue({
        synthetic_augmentations: ["lighting_variations"],
        simulated_environment: "indoor_kitchen_alt"
    })
}))

vi.mock('../src/lib/services/storage', () => ({
    generateDownloadUrl: vi.fn().mockResolvedValue("https://fake-s3-bucket.amazonaws.com/test-video.mp4")
}))

// Instead of directly spying on Prisma, we mock the entire `@prisma/client`
// import so `worker.ts` receives our controlled mock natively.
const mockUpdate = vi.fn().mockResolvedValue({
    id: 'sub-123',
    processing_status: 'ACCEPTED',
    accepted_minutes: 2,
    creator: {
        trust_tier: 'HIGH_TRUST',
        payout_account_id: 'acct_123'
    },
    mission: {
        price_per_minute: 1.50,
        company_id: 'comp-123'
    },
    labels_summary: {
        synthetic_data: { synthetic_augmentations: ["lighting_variations"], simulated_environment: "indoor_kitchen_alt" }
    }
});

const mockCreate = vi.fn().mockResolvedValue({
    id: 'sub-123',
    mission_id: 'miss-123',
    creator_id: 'creator-123',
    raw_storage_key: 'uploads/fake_video.mp4',
    processing_status: 'UPLOADED'
});

vi.mock('@prisma/client', () => {
    return {
        PrismaClient: class MockPrisma {
            submission = {
                create: mockCreate,
                update: mockUpdate,
                findUnique: vi.fn().mockResolvedValue({
                    id: 'sub-123',
                    processing_status: 'ACCEPTED',
                    accepted_minutes: 2,
                    mission: { price_per_minute: 1.50, company_id: 'comp-123' },
                    creator: { payout_account_id: 'acct_123' }
                })
            };
            $disconnect = vi.fn();
            paymentLedger = {
                create: vi.fn()
            };
            dataset = {
                findFirst: vi.fn().mockResolvedValue({ id: 'dataset-123' }),
                create: vi.fn().mockResolvedValue({ id: 'dataset-123' }),
                update: vi.fn()
            };
            datasetSample = {
                create: vi.fn()
            };
            mission = {
                findUnique: vi.fn()
            }
        }
    };
});

vi.mock('../src/lib/services/submissions', () => ({
    acceptSubmissionAndTriggerDownstream: vi.fn().mockResolvedValue(undefined)
}))

describe('E2E Pipeline Worker Process', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    })

    it('successfully executes the local pipeline test', async () => {
        const { processVideoSubmission } = await import('../worker')

        await processVideoSubmission('sub-123', 'uploads/fake_video.mp4')

        // Assert that the worker logic called prisma.submission.update with the synthesized output
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'sub-123' },
            data: expect.objectContaining({
                processing_status: 'IN_REVIEW',
                labels_summary: expect.objectContaining({
                    synthetic_data: expect.objectContaining({
                        synthetic_augmentations: ["lighting_variations"],
                        simulated_environment: "indoor_kitchen_alt"
                    })
                })
            })
        }))
    })
})