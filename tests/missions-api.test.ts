import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as CreateMission } from '../src/app/api/v1/missions/route'
import { auth } from '../src/lib/auth'
import { prisma } from '../src/lib/prisma'

vi.mock('../src/lib/auth', () => ({
  auth: vi.fn()
}))

vi.mock('../src/lib/prisma', () => {
  return {
    prisma: {
        mission: {
            create: vi.fn()
        }
    }
  }
})

describe('Missions API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated requests', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/v1/missions', { method: 'POST' })
    const res = await CreateMission(req)
    expect(res.status).toBe(403)
  })

  it('rejects creators from making missions', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'test-user', role: 'CREATOR' } } as any)
    const req = new NextRequest('http://localhost/api/v1/missions', { method: 'POST' })
    const res = await CreateMission(req)
    expect(res.status).toBe(403)
  })

  it('creates mission successfully for company', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'company-user', role: 'COMPANY' } } as any)

    const missionData = {
      title: 'Test Mission',
      description: 'A test mission description',
      task_type: 'KITCHEN_MANIPULATION',
      environment_type: 'INDOOR',
      constraints: {},
      required_resolution: '1080p',
      required_fps: 30,
      min_duration_seconds: 10,
      max_duration_seconds: 60,
      price_per_minute: 10,
      license_type: 'EXCLUSIVE'
    }

    const req = new NextRequest('http://localhost/api/v1/missions', {
      method: 'POST',
      body: JSON.stringify(missionData)
    })

    const mockCreatedMission = { id: 'mission-1', ...missionData }
    vi.mocked(prisma.mission.create).mockResolvedValue(mockCreatedMission as any)

    const res = await CreateMission(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('mission-1')
  })

  it('fails validation if required fields missing', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'company-user', role: 'COMPANY' } } as any)

    const req = new NextRequest('http://localhost/api/v1/missions', {
      method: 'POST',
      body: JSON.stringify({ title: 'Short' }) // missing fields
    })

    const res = await CreateMission(req)
    expect(res.status).toBe(400)
  })
})
