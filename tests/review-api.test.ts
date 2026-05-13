import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as ReviewSubmission } from '../src/app/api/v1/admin/submissions/[id]/review/route'
import { auth } from '../src/lib/auth'
import { processPayouts } from '../src/lib/services/payments'
import { prisma } from '../src/lib/prisma'

type TxMock = {
  submission: { update: ReturnType<typeof vi.fn> }
  dataset: {
    findFirst: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  datasetSample: { create: ReturnType<typeof vi.fn> }
}

vi.mock('../src/lib/auth', () => ({
  auth: vi.fn()
}))

vi.mock('../src/lib/services/payments', () => ({
  processPayouts: vi.fn()
}))

vi.mock('../src/lib/prisma', () => {
  const tx: TxMock = {
    submission: {
      update: vi.fn()
    },
    dataset: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    datasetSample: {
      create: vi.fn()
    }
  }

  return {
    prisma: {
        $transaction: vi.fn(async (fn: (tx: TxMock) => Promise<unknown>) => fn(tx)),
        submission: {
            findUnique: vi.fn()
        },
        __tx: tx
    }
  }
})

describe('Admin Review API', () => {
  const prismaMock = prisma as unknown as { __tx: TxMock }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated requests', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/v1/admin/submissions/1/review', { method: 'POST' })
    const res = await ReviewSubmission(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(403)
  })

  it('rejects company users from reviewing', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'test-user', role: 'COMPANY' } } as never)
    const req = new NextRequest('http://localhost/api/v1/admin/submissions/1/review', { method: 'POST' })
    const res = await ReviewSubmission(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(403)
  })

  it('accepts valid review from admin and triggers payout', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'admin-user', role: 'ADMIN' } } as never)

    vi.mocked(prisma.submission.findUnique).mockResolvedValue({
        id: 'sub-1',
        duration_seconds: 120,
        mission: {
            id: 'miss-1',
            company_id: 'comp-1',
            title: 'Test Mission',
            price_per_minute: 10,
            license_type: 'EXCLUSIVE'
        }
    } as never)

    vi.mocked(prismaMock.__tx.submission.update).mockResolvedValue({
        id: 'sub-1',
        duration_seconds: 120
    } as never)

    vi.mocked(prismaMock.__tx.dataset.findFirst).mockResolvedValue(null)
    vi.mocked(prismaMock.__tx.dataset.create).mockResolvedValue({ id: 'ds-1' } as never)
    vi.mocked(prismaMock.__tx.datasetSample.create).mockResolvedValue({ id: 'sample-1' } as never)

    const req = new NextRequest('http://localhost/api/v1/admin/submissions/1/review', {
      method: 'POST',
      body: JSON.stringify({
          status: 'ACCEPTED',
          accepted_minutes: 2
      })
    })

    const res = await ReviewSubmission(req, { params: Promise.resolve({ id: 'sub-1' }) })

    expect(res.status).toBe(200)
    expect(processPayouts).toHaveBeenCalledWith('sub-1', expect.any(Object))
    expect(prismaMock.__tx.datasetSample.create).toHaveBeenCalled()
  })
})
