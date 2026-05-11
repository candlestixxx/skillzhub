import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as GetManifest } from '../src/app/api/v1/datasets/[id]/manifest/route'
import { auth } from '../src/lib/auth'
import { prisma } from '../src/lib/prisma'
import crypto from "crypto"

vi.mock('../src/lib/auth', () => ({
  auth: vi.fn()
}))

vi.mock('../src/lib/storage', () => ({
  generateDownloadUrl: vi.fn().mockResolvedValue('https://mock-s3-url.com/video.mp4')
}))

vi.mock('../src/lib/prisma', () => {
  return {
    prisma: {
        aPIKey: {
            findFirst: vi.fn(),
            update: vi.fn()
        },
        dataset: {
            findUnique: vi.fn()
        }
    }
  }
})

describe('Datasets Manifest API - API Key Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows access with valid API key', async () => {
    const rawKey = 'sk_test_123'
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex')

    vi.mocked(prisma.aPIKey.findFirst).mockResolvedValue({
        id: 'key-1',
        company_id: 'company-1',
        hashed_key: hashedKey
    } as any)

    vi.mocked(prisma.dataset.findUnique).mockResolvedValue({
        id: 'ds-1',
        company_id: 'company-1',
        title: 'Test Dataset',
        license_type: 'EXCLUSIVE',
        total_duration_seconds: 120,
        dataset_samples: []
    } as any)

    // Using our mock NextRequest
    const req = new NextRequest('http://localhost/api/v1/datasets/ds-1/manifest', {
        headers: {
            'authorization': `Bearer ${rawKey}`
        }
    })

    const res = await GetManifest(req, { params: Promise.resolve({ id: 'ds-1' }) })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.dataset_id).toBe('ds-1')
  })

  it('rejects access if API key invalid and no session', async () => {
    vi.mocked(prisma.aPIKey.findFirst).mockResolvedValue(null)
    vi.mocked(auth).mockResolvedValue(null) // no session fallback

    const req = new NextRequest('http://localhost/api/v1/datasets/ds-1/manifest', {
        headers: {
            'authorization': 'Bearer sk_invalid_key'
        }
    })

    const res = await GetManifest(req, { params: Promise.resolve({ id: 'ds-1' }) })
    expect(res.status).toBe(401)
  })

  it('rejects if API key valid but dataset belongs to another company', async () => {
    const rawKey = 'sk_test_123'
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex')

    vi.mocked(prisma.aPIKey.findFirst).mockResolvedValue({
        id: 'key-1',
        company_id: 'company-1', // key belongs to company 1
        hashed_key: hashedKey
    } as any)

    vi.mocked(prisma.dataset.findUnique).mockResolvedValue({
        id: 'ds-1',
        company_id: 'company-2', // dataset belongs to company 2
        title: 'Test Dataset',
        license_type: 'EXCLUSIVE',
        total_duration_seconds: 120,
        dataset_samples: []
    } as any)

    const req = new NextRequest('http://localhost/api/v1/datasets/ds-1/manifest', {
        headers: {
            'authorization': `Bearer ${rawKey}`
        }
    })

    const res = await GetManifest(req, { params: Promise.resolve({ id: 'ds-1' }) })
    expect(res.status).toBe(403)
  })
})
